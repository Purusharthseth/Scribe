import { Router } from "express";
import {addVault, getAllVault, getVaultById, updateVaultFileTree, updateVaultName,
     deleteVault} from "../controllers/vault.controller.js";


const vaultRouter= Router();

vaultRouter.route("/").get(getAllVault);
vaultRouter.route("/:vaultId/name").put(updateVaultName);
vaultRouter.route("/:vaultId").delete(deleteVault);
vaultRouter.route("/add").post(addVault);
vaultRouter.route("/:vaultId/file-tree").put(updateVaultFileTree);
vaultRouter.route("/:vaultId").get(getVaultById);

export default vaultRouter;