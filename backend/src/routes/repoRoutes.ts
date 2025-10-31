import express from "express"
import multer from "multer";
import fs from "fs";

import {uploadController,getReposController,repoViewController, getNodesController} from "../controllers/repoController.js"
export const repoRouter = express()

// Make sure directories exist
//shud i be deleting this after every upload is done? nah let it be ig
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.memoryStorage();

/*
either theres post request when user wants to 
upload zip,or get request when user clicks on repo
and content of that repo is displayed
 */
//in future when auth is implemented,userId should NOT be in the url, this is only for testing
repoRouter.post("/upload", uploadController);
repoRouter.get("/api/:userId/repos",getReposController);
repoRouter.get("/api/:userId/:repoId",repoViewController);
repoRouter.get("/api/:userId/:commitId/:nodeId",getNodesController)