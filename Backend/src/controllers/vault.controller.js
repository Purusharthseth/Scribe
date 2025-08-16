import { and, eq, or, ne } from "drizzle-orm";
import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import db from "../db/drizzle.js";
import { vaults } from "../db/schema.js";
import ApiError from "../utils/ApiError.js";
import { nanoid } from 'nanoid';

const allowedShareModes = new Set(['private', 'view', 'edit']);

const getAllVault = AsyncHandler(async (req, res) => {
  const userId = req.auth().userId;

  const userVaults = await db
    .select()
    .from(vaults)
    .where(eq(vaults.owner_id, userId));

  return res.status(200).json(new ApiResponse(200, userVaults, "Vaults fetched successfully"));
});

const deleteVault = AsyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const userId = req.auth().userId;

  const deletedVault = await db
    .delete(vaults)
    .where(and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)))
    .returning();

  if (!deletedVault[0]) throw new ApiError(404, "Vault not found or you aren't the owner.");

  return res.status(200).json(new ApiResponse(200, deletedVault[0], "Vault deleted successfully."));
});

const getVaultById = AsyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const userId = req.auth().userId;
  const shareToken = req.query?.shareToken;

  let whereClause;
  if (shareToken) {
    whereClause = or(
      and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
      and(
        eq(vaults.id, vaultId),
        eq(vaults.share_token, shareToken),
        ne(vaults.share_mode, "private")
      )
    );
  } else {
    whereClause = and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));
  }

  const row = await db.select().from(vaults).where(whereClause);
  if (!row[0]) throw new ApiError(404, "Vault not found or you don't have access.");

  return res.status(200).json(new ApiResponse(200, row[0], "Vault fetched successfully."));
});

const addVault = AsyncHandler(async (req, res) => {
  const { name } = req.body;
  const userId = req.auth().userId;

  if (!name || !name.trim()) throw new ApiError(400, "Vault name cannot be empty.");

  const newVault = await db
    .insert(vaults)
    .values({ owner_id: userId, name: name.trim() })
    .returning();

  if (!newVault[0]) throw new ApiError(500, "Failed to create vault.");

  return res.status(201).json(new ApiResponse(201, newVault[0], "Vault created successfully."));
});

const updateVaultName = AsyncHandler(async (req, res) => {
  const { name } = req.body;
  const { vaultId } = req.params;
  const userId = req.auth().userId;
  const shareToken = req.query?.shareToken;

  if (!name || !name.trim())
    throw new ApiError(400, "Vault name cannot be empty.");

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

  const updatedVault = await db
    .update(vaults)
    .set({ name: name.trim(), updated_at: new Date() })
    .where(whereClause)
    .returning();

  if (!updatedVault[0]) throw new ApiError(403, "No permission. You must be the owner or provide a valid edit token.");

  return res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault name updated successfully."));
});

const updateVaultFileTree = AsyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const { fileTree } = req.body;
  const userId = req.auth().userId;
  const shareToken = req.query?.shareToken;

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

  const updatedVault = await db
    .update(vaults)
    .set({ file_tree: fileTree, updated_at: new Date() })
    .where(whereClause)
    .returning();

  if (!updatedVault[0])
    throw new ApiError(404, "Vault not found or you don't have access.");

  return res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault file tree updated successfully."));
});

const changeShareMode = AsyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const { shareMode } = req.body;
  const userId = req.auth().userId;

  if (!allowedShareModes.has(shareMode)) {
    throw new ApiError(400, "Invalid share mode.");
  }

  const [currentVault] = await db
    .select()
    .from(vaults)
    .where(and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)));

  if (!currentVault) {
    throw new ApiError(404, "Vault not found or access denied.");
  }

  let updateData = {
    share_mode: shareMode,
    updated_at: new Date(),
  };

  if (shareMode !== "private" && !currentVault.share_token) {
    updateData.share_token = nanoid(16);
  }

  const [updated] = await db
    .update(vaults)
    .set(updateData)
    .where(eq(vaults.id, vaultId))
    .returning();

  return res.status(200).json(new ApiResponse(200, updated, "Vault share mode updated successfully."));
});

const changeShareToken = AsyncHandler(async (req, res) => {
  const { vaultId } = req.params;
  const userId = req.auth().userId;

  const newShareToken = nanoid(16);

  const updatedVault = await db
    .update(vaults)
    .set({ share_token: newShareToken, updated_at: new Date() })
    .where(and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)))
    .returning();

  if (!updatedVault[0])
    throw new ApiError(404, "Vault not found or access denied.");

  return res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault share token updated successfully."));
});

export {
  getAllVault,
  updateVaultName,
  addVault,
  updateVaultFileTree,
  getVaultById,
  deleteVault,
  changeShareMode,
  changeShareToken,
};