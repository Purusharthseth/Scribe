import { Router } from "express";
import { addFile, deleteFile, getFileContent, updateFileContent, updateFileName } from "../controllers/file.controller.js";

const fileRouter= Router();

fileRouter.route('/:fileId').get(getFileContent);
fileRouter.route('/:fileId').put(updateFileContent);
fileRouter.route('/').post(addFile);
fileRouter.route('/:fileId/name').put(updateFileName);
fileRouter.route('/:fileId').delete(deleteFile);

export default fileRouter;