import express from "express"
import multer from "multer";
import fs from "fs";
import type { Request, Response } from 'express';
import type {PushRequest} from '../controllers/repoController.js'

import {uploadController,getReposController} from "../controllers/repoController.js"
export const repoRouter = express()

// Make sure directories exist
//shud i be deleting this after every upload is done? nah let it be ig
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.memoryStorage();
const upload = multer({storage});

/*
either theres post request when user wants to 
upload zip,or get request when user clicks on repo
and content of that repo is displayed
 */
repoRouter.post("/upload", uploadController);
repoRouter.get("/repos",getReposController); //should change to userid/repos but eh
//repoRouter.get("/:repoId",repoViewController)