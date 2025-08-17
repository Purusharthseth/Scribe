import db from "../db/drizzle.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { vaults, files } from "../db/schema.js";
import { and, eq, or, ne } from "drizzle-orm";

// Socket.IO instance for emitting events
let socketIO;

// Function to set socket instance
export const setSocketIO = (io) => {
  socketIO = io;
};

// Helper to emit file tree updates
const emitFileTreeUpdate = (vaultId, fileTree) => {
  if (socketIO) {
    socketIO.to(`vault:${vaultId}`).emit("file-tree:updated", {
      fileTree,
      timestamp: new Date().toISOString()
    });
  }
};

// HELPERS
const addFileToTree = (tree, newFile, parentFolderId = null) => {
  const fileNode = { id: newFile.id, name: newFile.name, type: "file" };

  if (!parentFolderId) {
    tree.push(fileNode);
    return tree;
  }
  const DFS = (nodes) => {
    for (let node of nodes) {
      if (node.type === "folder" && node.id === parentFolderId) {
        node.children = node.children || [];
        node.children.push(fileNode);
        return true;
      }
      if (node.children && DFS(node.children)) return true;
    }
    return false;
  };
  DFS(tree);
  return tree;
};

const removeFileFromTree = (tree, fileId) => {
  for (let i = tree.length - 1; i >= 0; i--) {
    const node = tree[i];
    if (node.type === "file" && node.id === fileId) {
      tree.splice(i, 1);
    } else if (node.children) {
      removeFileFromTree(node.children, fileId);
    }
  }
  return tree;
};

const renameFileInTree = (tree, fileId, newName) => {
  const DFS = (nodes) => {
    for (let node of nodes) {
      if (node.type === "file" && node.id === fileId) {
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

//ACTUAL CONTROLLERS
const getFileContent = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const shareToken = req.query?.shareToken;
  const ownerClause = eq(vaults.owner_id, userId);
  const tokenClause = and(
    eq(vaults.share_token, shareToken ?? "__no_token__"),
    ne(vaults.share_mode, "private")
  );

  const rows = await db
    .select({
      content: files.content,
    })
    .from(files)
    .innerJoin(vaults, eq(vaults.id, files.vault_id))
    .where(
      and(
        eq(files.id, fileId),
        shareToken ? or(ownerClause, tokenClause) : ownerClause
      )
    );

  if (!rows[0]) throw new ApiError(404, "File not found or access denied.");

  return res.status(200).json(new ApiResponse(200, { content: rows[0].content }, "File content fetched successfully."));
});

const updateFileContent = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { newContent } = req.body;
  const shareToken = req.query?.shareToken;

  const ownerClause = eq(vaults.owner_id, userId);
  const editTokenClause = and(
    eq(vaults.share_token, shareToken ?? "__no_token__"),
    eq(vaults.share_mode, "edit")
  );

  // Check access in a single query
  const rows = await db
    .select({ file_id: files.id })
    .from(files)
    .innerJoin(vaults, eq(vaults.id, files.vault_id))
    .where(
      and(
        eq(files.id, fileId),
        shareToken ? or(ownerClause, editTokenClause) : ownerClause
      )
    );

  if (!rows[0]) throw new ApiError(403, "Access denied to the file.");

  // Update content
  await db
    .update(files)
    .set({ content: newContent, updated_at: new Date() })
    .where(eq(files.id, fileId));

  return res.status(200).json(new ApiResponse(200, null, "File content updated successfully."));
});

const addFile = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId, name, content, folderId } = req.body;
  const shareToken = req.query?.shareToken;

  if (!name || !name.trim())
    throw new ApiError(400, "File name cannot be empty.");

  await db.transaction(async (tx) => {
    // 1) Access check: owner OR edit token
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

    // 2) Create file (FK ensures folder belongs to same vault)
    const [newFile] = await tx
      .insert(files)
      .values({
        vault_id: vaultId,
        folder_id: folderId || null,
        name: name.trim(),
        content,
      })
      .returning();

    // 3) Update tree
    const updatedTree = addFileToTree(vaultRow.file_tree, newFile, folderId || null);

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));

    // Emit socket event for file tree update
    emitFileTreeUpdate(vaultId, updatedTree);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { file: newFile, file_tree: updatedTree },
          "File created successfully."
        )
      );
  });
});

const updateFileName = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { vaultId, newName } = req.body;
  const shareToken = req.query?.shareToken;

  if (!newName || !newName.trim())
    throw new ApiError(400, "File name cannot be empty.");

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
      .update(files)
      .set({ name: newName.trim(), updated_at: new Date() })
      .where(and(eq(files.id, fileId), eq(files.vault_id, vaultId)))
      .returning();

    if (!updated[0]) throw new ApiError(404, "File not found in this vault.");

    const updatedTree = renameFileInTree(vaultRow.file_tree, fileId, newName.trim());

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));

    // Emit socket event for file tree update
    emitFileTreeUpdate(vaultId, updatedTree);

    return res.status(200).json(new ApiResponse(200, { file_tree: updatedTree }, "File name updated successfully."));
  });
});

const deleteFile = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { vaultId } = req.body;
  const shareToken = req.query?.shareToken;

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
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.vault_id, vaultId)))
      .returning();

    if (!deleted[0]) throw new ApiError(404, "File not found in this vault.");

    const updatedTree = removeFileFromTree(vaultRow.file_tree, fileId);

    await tx
      .update(vaults)
      .set({ file_tree: updatedTree, updated_at: new Date() })
      .where(eq(vaults.id, vaultId));

    // Emit socket event for file tree update
    emitFileTreeUpdate(vaultId, updatedTree);

    return res.status(200).json(new ApiResponse(200, { file_tree: updatedTree }, "File deleted successfully."));
  });
});

export { getFileContent, updateFileContent, addFile, updateFileName, deleteFile };