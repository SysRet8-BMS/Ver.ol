import express from "express"
import multer from "multer";
import fs from "fs";

import {
    uploadController, getReposController, repoViewController, 
    getNodesController, getCommitHistoryController, commitController,
    getFileController,
} from "../controllers/repoController.js"

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
repoRouter.get("/api/getFile/:fileId", getFileController)
repoRouter.get("/api/:repoId",repoViewController);
repoRouter.get("/api/:commitId/:nodeId",getNodesController);
repoRouter.post("/api/commit", commitController);
repoRouter.post("/api/getCommits", getCommitHistoryController);