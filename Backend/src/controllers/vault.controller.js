import { and, eq, or } from "drizzle-orm";
import ApiResponse from "../utils/ApiResponse.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import db from "../db/drizzle.js";
import { vaults } from "../db/schema.js";
import ApiError from "../utils/ApiError.js";
import { nanoid } from 'nanoid';
//APIs to add, change sharing mode.
// ABOVE IS IMPORTANT.

const getAllVault= AsyncHandler(async(req, res)=>{
    const userId = req.auth().userId;
    const userVaults = await db
        .select()
        .from(vaults)
        .where(eq(vaults.owner_id, userId));
    return res.status(200).json(new ApiResponse(200, userVaults, "Vaults fetched succesfully"));
});

const deleteVault = AsyncHandler(async (req, res) => {
    const { vaultId } = req.params;
    const userId = req.auth().userId;
    const deletedVault = await db
        .delete(vaults)
        .where(
            and(
                eq(vaults.id, vaultId),
                eq(vaults.owner_id, userId)
            )
        )
        .returning();  
    if (!deletedVault[0]) throw new ApiError(404, "Vault not found or you aren't the owner.");
    return res.status(200).json(new ApiResponse(200, deletedVault[0], "Vault deleted successfully."));
});

const getVaultById = AsyncHandler(async (req, res) => {
    const { vaultId } = req.params;
    const userId = req.auth().userId;
    // Accept shareToken from query (preferred for GET) or body (legacy)
    const shareToken = req.query?.shareToken || req.body?.shareToken;

    let whereClause;
    if (shareToken) {
        whereClause = or(
            and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId)),
            eq(vaults.share_token, shareToken)
        );
    } else {
        whereClause = and(eq(vaults.id, vaultId), eq(vaults.owner_id, userId));
    }

    const vault = await db
        .select()
        .from(vaults)
        .where(whereClause);

    if (!vault[0]) throw new ApiError(404, "Vault not found or you don't have access to do so.");

    res.status(200).json(new ApiResponse(200, vault[0], "Vault fetched successfully."));
});

const addVault = AsyncHandler(async (req, res) => {
    const { name } = req.body;
    const userId = req.auth().userId;
    if (name.trim() === "") throw new ApiError(400, "Vault name cannot be empty.");
    const newVault = await db
        .insert(vaults)
        .values({ owner_id: userId, name })
        .returning();

    if(!newVault[0]) throw new ApiError(500, "Failed to create vault.");
    res.status(201).json(new ApiResponse(201, newVault[0], "Vault created successfully."));
});

const updateVaultName = AsyncHandler(async (req, res) => {
    const { name } = req.body;
    const { vaultId } = req.params;
    const userId = req.auth().userId;
    if (!name.trim()) throw new ApiError(400, "Vault name cannot be empty.");

    const updatedVault = await db
        .update(vaults)
        .set({ 
            name,
            updated_at: new Date() // Added updated_at timestamp
        })
        .where(
            and(
                eq(vaults.id, vaultId),
                eq(vaults.owner_id, userId)
            ),
        )
        .returning();

    if (!updatedVault[0]) throw new ApiError(403,  "No permission. You must be the owner or provide a valid edit token.");
    
    res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault name updated successfully."));
});

const updateVaultFileTree = AsyncHandler(async (req, res) => {
    const { vaultId } = req.params;
    const { fileTree, shareToken } = req.body;
    const userId = req.auth().userId;

    const updatedVault = await db
        .update(vaults)
        .set({ 
            file_tree: fileTree,
            updated_at: new Date() // Added updated_at timestamp
        })
        .where(
            or(
                and(
                    eq(vaults.id, vaultId),
                    eq(vaults.owner_id, userId)
                ),
                and(
                    eq(vaults.id, vaultId),
                    eq(vaults.share_token, shareToken),
                    eq(vaults.share_mode, 'edit')
                )
            )
        )
        .returning();

    if (!updatedVault[0]) throw new ApiError(404, "Vault not found or you don't have access to do so.");

    res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault file tree updated successfully."));
});

const changeShareMode = AsyncHandler(async (req, res) => {
    const { vaultId } = req.params;
    const { shareMode } = req.body;
    const userId = req.auth().userId;

    const [currentVault] = await db
        .select()
        .from(vaults)
        .where(
            and(
                eq(vaults.id, vaultId),
                eq(vaults.owner_id, userId)
            )
        );

    if (!currentVault) {
        throw new ApiError(404, "Vault not found or you don't have access to do so.");
    }

    let newShareToken = currentVault.share_token;

    if (shareMode !== 'private' && !currentVault.share_token) {
        newShareToken = nanoid(16);
    }

    const updatedVault = await db
        .update(vaults)
        .set({
            share_mode: shareMode,
            share_token: newShareToken,
            updated_at: new Date()
        })
        .where(eq(vaults.id, vaultId))
        .returning();

    res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault share mode updated successfully."));
});

const changeShareToken = AsyncHandler(async (req, res) => {
    const { vaultId } = req.params;
    const userId = req.auth().userId;

    const newShareToken = nanoid(16);

    const updatedVault = await db
        .update(vaults)
        .set({
            share_token: newShareToken,
            updated_at: new Date()
        })
        .where(
            and(
                eq(vaults.id, vaultId),
                eq(vaults.owner_id, userId)
            )
        )
        .returning();

    if (!updatedVault[0]) throw new ApiError(404, "Vault not found or you don't have access to do so.");

    res.status(200).json(new ApiResponse(200, updatedVault[0], "Vault share token updated successfully."));
});

export { getAllVault, updateVaultName, addVault, updateVaultFileTree, getVaultById, deleteVault, changeShareMode, changeShareToken };