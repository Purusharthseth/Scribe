import { Router } from "express";
import {addVault, getAllVault, getVaultById, updateVaultFileTree, updateVaultName,
     deleteVault,
     changeShareMode,
     changeShareToken} from "../controllers/vault.controller.js";


const vaultRouter= Router();

vaultRouter.route("/").get(getAllVault);
vaultRouter.route("/:vaultId/name").put(updateVaultName);
vaultRouter.route("/:vaultId").delete(deleteVault);
vaultRouter.route("/").post(addVault);
vaultRouter.route("/:vaultId/file-tree").put(updateVaultFileTree);
vaultRouter.route("/:vaultId").get(getVaultById);
vaultRouter.route("/:vaultId/shareMode").put(changeShareMode);
vaultRouter.route("/:vaultId/shareToken").put(changeShareToken);

export default vaultRouter;