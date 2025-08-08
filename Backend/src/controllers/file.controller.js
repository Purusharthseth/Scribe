import db from "../db/drizzle.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { vaults, files } from "../db/schema.js";
import { and, eq, or } from "drizzle-orm";


const addFileToTree = (tree, newFile, parentFolderId = null) => {
  const fileNode = {
    id: newFile.id,
    name: newFile.name,
    type: "file",
  };

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
      if (node.children) {
        if (DFS(node.children)) return true;
      }
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
      if (node.children) {
        if (DFS(node.children)) return true;
      }
    }
    return false;
  };
  DFS(tree);
  return tree;
};

const getFileContent = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const shareToken  = req.body?.shareToken;

  // 1. Fetch the file and validate access
  const [file] = await db
    .select({
      id: files.id,
      vault_id: files.vault_id,
      content: files.content,
    })
    .from(files)
    .where(eq(files.id, fileId));

  if (!file) throw new ApiError(404, "File not found.");

  // 2. Validate user access to the vault
  const [vault] = await db
    .select()
    .from(vaults)
    .where(
      or(
        and(eq(vaults.id, file.vault_id), eq(vaults.owner_id, userId)),
        and(eq(vaults.id, file.vault_id), eq(vaults.share_token, shareToken))
      )
    );

  if (!vault) throw new ApiError(403, "Access denied to the vault.");

  // 3. Return the file content
  res.status(200).json(new ApiResponse(200, { content: file.content }, "File content fetched successfully."));
});


const updateFileContent = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { newContent, shareToken } = req.body;

  // 1. Fetch the file and validate access
  const [file] = await db
    .select({
      id: files.id,
      vault_id: files.vault_id,
    })
    .from(files)
    .where(eq(files.id, fileId));

  if (!file) throw new ApiError(404, "File not found.");

  // 2. Validate user access to the vault
  const [vault] = await db
    .select()
    .from(vaults)
    .where(
      or(
        and(eq(vaults.id, file.vault_id), eq(vaults.owner_id, userId)),
        and(eq(vaults.id, file.vault_id), eq(vaults.share_token, shareToken))
      )
    );

  if (!vault) throw new ApiError(403, "Access denied to the vault.");

  // 3. Update the file content
  await db
    .update(files)
    .set({
      content: newContent,
      updated_at: new Date(),
    })
    .where(eq(files.id, fileId));

  // 4. Respond with success
  res.status(200).json(new ApiResponse(200, null, "File content updated successfully."));
});

const addFile = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { vaultId, name, content, folderId, shareToken } = req.body;

  await db.transaction(async (tx) => {
    // 1. Validate vault access
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

    // 2. Create file in DB
    const [newFile] = await tx
      .insert(files)
      .values({
        vault_id: vaultId,
        folder_id: folderId || null,
        name,
        content,
      })
      .returning();

    // 3. Update file_tree
    const updatedTree = addFileToTree(vault.file_tree, newFile, folderId);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(201).json(
      new ApiResponse(201, { file: newFile, file_tree: updatedTree }, "File created successfully.")
    );
  });
});

const updateFileName = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { vaultId, newName, shareToken } = req.body;

  await db.transaction(async (tx) => {
    // 1. Validate vault access
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

    // 2. Update file name in DB
    await tx
      .update(files)
      .set({ name: newName, updated_at: new Date() })
      .where(eq(files.id, fileId));

    // 3. Update file_tree
    const updatedTree = renameFileInTree(vault.file_tree, fileId, newName);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(200).json(
      new ApiResponse(200, { file_tree: updatedTree }, "File name updated successfully.")
    );
  });
});

const deleteFile = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;
  const { fileId } = req.params;
  const { vaultId, shareToken } = req.body;

  await db.transaction(async (tx) => {
    // 1. Validate vault access
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

    // 2. Delete file from DB
    await tx.delete(files).where(eq(files.id, fileId));

    // 3. Update file_tree
    const updatedTree = removeFileFromTree(vault.file_tree, fileId);

    await tx
      .update(vaults)
      .set({
        file_tree: updatedTree,
        updated_at: new Date(),
      })
      .where(eq(vaults.id, vaultId));

    res.status(200).json(
      new ApiResponse(200, { file_tree: updatedTree }, "File deleted successfully.")
    );
  });
});

export { getFileContent, updateFileContent, addFile, updateFileName, deleteFile };