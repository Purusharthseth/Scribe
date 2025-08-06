import { and, eq, or } from "drizzle-orm";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import db from "../db/drizzle.js";
import { vaults, folders } from "../db/schema.js";

// Helper function to add folder to file_tree
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
      if (node.children) {
        if (DFS(node.children)) return true;
      }
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
      tree.splice(i, 1); // remove the folder
    } else if (node.children) {
      removeFromTree(node.children, folderId); // recurse
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
      if (node.children) {
        if (DFS(node.children)) return true;
      }
    }
    return false;
  };
  DFS(tree);
  return tree;
};

const addFolder = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId, name } = req.body;
  const shareToken = req.body?.shareToken
  const parentId = req.body?.parentId;

  await db.transaction(async (tx) => {
    //1. Check if user is allowed to edit or not.
    const [vault] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(
        or(
          and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
          and(eq(vaults.id, vaultId), eq(vaults.share_token, shareToken))
        )
      );

    if (!vault) throw new ApiError(404, "Vault not found or access denied.");

    // 2. Create folder in DB
    const [newFolder] = await tx
      .insert(folders)
      .values({
        vault_id: vaultId,
        parent_id: parentId || null, 
        name,
      })
      .returning();

    // 3. Update file_tree in the vault
    const updatedTree = addFolderToTree(vault.file_tree, newFolder, parentId);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(201).json(
      new ApiResponse(201, { folder: newFolder, file_tree: updatedTree }, "Folder created successfully.")
    );
  });
});

const editFolderName = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const {folderId} = req.params;
  const { vaultId, newName } = req.body;
  const shareToken = req.body?.shareToken;

  await db.transaction(async (tx) => {
    // 1. Validate vault ownership or access
    const [vault] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(
        or(
          and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
          and(eq(vaults.id, vaultId), eq(vaults.share_token, shareToken))
        )
      );

    if (!vault) throw new ApiError(404, "Vault not found or access denied.");

    // 2. Update folder name in DB
    await tx
      .update(folders)
      .set({ name: newName, updated_at: new Date() })
      .where(eq(folders.id, folderId));

    // 3. Update file_tree in the vault
    const updatedTree = renameInTree(vault.file_tree, folderId, newName);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(200).json(
      new ApiResponse(200, { file_tree: updatedTree }, "Folder name updated successfully.")
    );
  });
});


const deleteFolder = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId, shareToken } = req.body;
  const {folderId} = req.params;

  await db.transaction(async (tx) => {
    // 1. Validate vault ownership or access
    const [vault] = await tx
      .select({ file_tree: vaults.file_tree })
      .from(vaults)
      .where(
        or(
          and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
          and(eq(vaults.id, vaultId), eq(vaults.share_token, shareToken))
        )
      );

    if (!vault) throw new ApiError(404, "Vault not found or access denied.");

    // 2. Delete folder and its children from DB
    await tx
      .delete(folders)
      .where(eq(folders.id, folderId));

    // 3. Update file_tree in the vault
    const updatedTree = removeFromTree(vault.file_tree, folderId);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(200).json(
      new ApiResponse(200, { file_tree: updatedTree }, "Folder deleted successfully.")
    );
  });
});

export { addFolder, editFolderName, deleteFolder };