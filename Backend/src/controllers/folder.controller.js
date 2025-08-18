import { and, eq, or } from "drizzle-orm";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import db from "../db/drizzle.js";
import { vaults, folders } from "../db/schema.js";

let socketIO;

export const setSocketIO = (io) => socketIO = io;


// Helper to emit file tree updates
const emitFileTreeUpdate = (vaultId, fileTree, excludeSocketId = null) => {
  if (socketIO) {
    const emitter = excludeSocketId 
      ? socketIO.to(`vault:${vaultId}`).except(excludeSocketId)
      : socketIO.to(`vault:${vaultId}`);
    emitter.emit("file-tree:updated", {
      fileTree,
      timestamp: new Date().toISOString()
    });
  }
};

// HELPERS
const addFolderToTree = (tree, newFolder, parentFolderId = null) => {
  const folderNode = {
    id: newFolder.id,
    name: newFolder.name,
    type: "folder",
    children: [],
  };

  if (!parentFolderId) {
    tree.push(folderNode);
    return tree;
  }

  const DFS = (nodes) => {
    for (let node of nodes) {
      if (node.type === "folder" && node.id === parentFolderId) {
        node.children = node.children || [];
        node.children.push(folderNode);
        return true;
      }
      if (node.children && DFS(node.children)) return true;
    }
    return false;
  };

  DFS(tree);
  return tree;
};

const removeFromTree = (tree, folderId) => {
  for (let i = tree.length - 1; i >= 0; i--) {
    const node = tree[i];
    if (node.id === folderId) {
      tree.splice(i, 1);
    } else if (node.children) {
      removeFromTree(node.children, folderId);
    }
  }
  return tree;
};

const renameInTree = (tree, folderId, newName) => {
  const DFS = (nodes) => {
    for (let node of nodes) {
      if (node.id === folderId) {
        node.name = newName;
        return true;
      }
      if (node.children && DFS(node.children)) return true;
    }
    return false;
  };
  DFS(tree);
  return tree;
};

//ACTUAL API ENDPOINTS

const addFolder = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId, name, parentId } = req.body;
  const shareToken = req.query?.shareToken;
  const socketId = req.headers['x-socket-id'];

  if (!name || !name.trim()) throw new ApiError(400, "Folder name cannot be empty.");

  await db.transaction(async (tx) => {
    let whereClause;
    if (shareToken) {
      whereClause = or(
        and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
        and(
          eq(vaults.id, vaultId),
          eq(vaults.share_token, shareToken),
          eq(vaults.share_mode, "edit")
        )
      );
    } else {
      whereClause = and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));
    }

    const [vaultRow] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(whereClause);

    if (!vaultRow) throw new ApiError(404, "Vault not found or access denied.");

    const [newFolder] = await tx
      .insert(folders)
      .values({
        vault_id: vaultId,
        parent_id: parentId || null,
        name: name.trim(),
      })
      .returning();

    if (!newFolder) throw new ApiError(500, "Failed to create folder.");

    const updatedTree = addFolderToTree(vaultRow.file_tree, newFolder, parentId || null);

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));

    emitFileTreeUpdate(vaultId, updatedTree, socketId);

    return res.status(201).json(new ApiResponse(
        201,
        { folder: newFolder, file_tree: updatedTree },
        "Folder created successfully."
      ));
  });
});

const editFolderName = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { folderId } = req.params;
  const { vaultId, newName } = req.body;
  const shareToken = req.query?.shareToken;
  const socketId = req.headers['x-socket-id'];

  if (!newName || !newName.trim()) throw new ApiError(400, "Folder name cannot be empty.");

  await db.transaction(async (tx) => {
    let whereClause;
    if (shareToken) {
      whereClause = or(
        and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
        and(
          eq(vaults.id, vaultId),
          eq(vaults.share_token, shareToken),
          eq(vaults.share_mode, "edit")
        )
      );
    } else {
      whereClause = and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));
    }

    const [vaultRow] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(whereClause);

    if (!vaultRow) throw new ApiError(404, "Vault not found or access denied.");

  
    const updated = await tx
      .update(folders)
      .set({ name: newName.trim(), updated_at: new Date() })
      .where(and(eq(folders.id, folderId), eq(folders.vault_id, vaultId)))
      .returning();

    if (!updated[0]) throw new ApiError(404, "Folder not found in this vault.");

    const updatedTree = renameInTree(vaultRow.file_tree, folderId, newName.trim());

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));

    emitFileTreeUpdate(vaultId, updatedTree, socketId);

    return res.status(200).json(new ApiResponse(200, { file_tree: updatedTree }, "Folder name updated successfully."));
  });
});

const deleteFolder = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId } = req.body;
  const shareToken = req.query?.shareToken;
  const socketId = req.headers['x-socket-id'];
  const { folderId } = req.params;

  await db.transaction(async (tx) => {
    let whereClause;
    if (shareToken) {
      whereClause = or(
        and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
        and(
          eq(vaults.id, vaultId),
          eq(vaults.share_token, shareToken),
          eq(vaults.share_mode, "edit")
        )
      );
    } else {
      whereClause = and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));
    }

    const [vaultRow] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(whereClause);

    if (!vaultRow) throw new ApiError(404, "Vault not found or access denied.");

    const deleted = await tx
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.vault_id, vaultId)))
      .returning();

    if (!deleted[0]) throw new ApiError(404, "Folder not found in this vault.");

    const updatedTree = removeFromTree(vaultRow.file_tree, folderId);

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));
    emitFileTreeUpdate(vaultId, updatedTree, socketId);

    return res.status(200).json(new ApiResponse(200, { file_tree: updatedTree }, "Folder deleted successfully."));
  });
});

export { addFolder, editFolderName, deleteFolder };