import { Router } from "express";
import { addFolder, deleteFolder, editFolderName } from "../controllers/folder.controller";

const folderRouter= Router();
folderRouter.route("/").post(addFolder);
folderRouter.route("/:folderId/name").put(editFolderName);
folderRouter.route("/:folderId").delete(deleteFolder);
export default folderRouter;