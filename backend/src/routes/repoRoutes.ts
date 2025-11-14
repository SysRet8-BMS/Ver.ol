import express from "express"
import multer from "multer";
import fs from "fs";

import {
    uploadController, getReposController, repoViewController, 
    getNodesController,
    getFileController,
    delRepoController,
} from "../controllers/repoController.js"
import {
    getCommitHistoryController, commitController,getCommitInfoController
} from "../controllers/commitController.js"

export const repoRouter: express.Router = express()

// Make sure directories exist
//shud i be deleting this after every upload is done? nah let it be ig
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.memoryStorage();

/*
either theres post request when user wants to 
upload zip,or get request when user clicks on repo
and content of that repo is displayed
 */
repoRouter.post("/api/upload", uploadController);
repoRouter.get("/api/repos",getReposController);
repoRouter.post("/api/commit", commitController);
repoRouter.get("/api/getCommits/:repoId", getCommitHistoryController);

repoRouter.get("/api/getFile/:fileId", getFileController)
repoRouter.get("/api/commitInfo/:repoId/:commitId",getCommitInfoController);
repoRouter.get("/api/:commitId/:nodeId",getNodesController);
repoRouter.get("/api/:repoId",repoViewController);
repoRouter.delete("/api/delete/:repoId",delRepoController);