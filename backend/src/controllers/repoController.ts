import type { Request, Response } from 'express';
import mongoose ,{ Types } from 'mongoose';
import busboy from 'busboy';
import unzipper from 'unzipper';
import path from 'path'

import * as storageService from '../services/storageService.js';
import * as repoService from '../services/repoService.js';
import { getGfs } from '../config/multer.js';


import type {IRepository} from '../models/repository.js'
import type {ICommit} from '../models/commit.js';
import type {INode} from '../models/node.js';
import Repository from '../models/repository.js'
import Commit from '../models/commit.js'
import Node from '../models/node.js'
import User from '../models/user.js'

// Replace this with the actual authenticated user ID later 
// const AUTHOR_ID = new Types.ObjectId('60d5ec49c69d7b0015b8d28e');

// Extend Request to include file details from Multer's memoryStorage
export interface PushRequest extends Request {
    file: Express.Multer.File & {buffer: Buffer; };
}

export const uploadController = async (req: Request, res: Response): Promise<void> =>{
    let repoName: string;
    let commitMessage: string | 'No message provided';
    let userId: string;
    let repoId :Types.ObjectId = new Types.ObjectId();
    let commitId :Types.ObjectId = new Types.ObjectId();
    let commits :Types.ObjectId[] = [];

    const fileProcessingPromises:Promise<void>[] = []; // To track async unzipping work
    const bb = busboy({headers: req.headers});


    bb.on('field', (key, value) => {
        if(key === 'repoName') {
            if (!value) {
                res.status(400).json({ error: 'Repository name is required' });
                bb.removeAllListeners(); // stop processing further fields/files
                return;
            }            
            repoName = value;
        }
        else if(key === 'commitMessage') {
            commitMessage = value;
        }
        else if (key === 'userId'){
            userId = value;
        }
    });

    bb.on('file', (fieldname, fileStream, fileInfo) => {
        const { filename, mimeType } = fileInfo;

        if (mimeType !== 'application/zip' && mimeType !== 'application/x-zip-compressed') {
            console.error(`Received non-zip file: ${filename}. Skipping.`);
            fileStream.resume(); // Essential: consume the stream even if skipping
            return;
        }

        console.log(`\nStarting to process Zip: ${filename}`);

        // 2. Pipe the incoming zip file stream to unzipper.Parse()
        const unzipperStream = fileStream.pipe(unzipper.Parse());

        // 3. Create a promise to manage the asynchronous file reading
        const zipPromise:Promise<void> = new Promise((resolve, reject) => {
            
            // unzipper emits an 'entry' event for each file found inside the zip
            unzipperStream.on('entry', async (entry) => {
                let newNode:INode; //create node for every file/folder
                let nodeType:string;
                let nodeName:string;
                console.log('reading entry',entry.path)
                // Skip directories
                if (entry.type !== 'File') {
                    entry.autodrain(); 
                    return;
                }
                nodeName = path.basename(entry.path)
                console.log(`Reading file inside zip: ${nodeName}`);

                try {
                    // 4. Read the content of the single file
                    //store it in gridfs
                    const fileBuffer = await entry.buffer(); //potential choke here
                    // **********************************************
                    // 5. PROCESS YOUR SINGLE FILE CONTENT HERE
                    // The contentBuffer holds the data for ONE file.
                    // **********************************************
                    let parentNodeId:Types.ObjectId | null = await ensureFolders(repoId,commitId,entry.path);

                    let gridFSFileId: Types.ObjectId | null = null; //use it in nodes collection
                    try{
                        gridFSFileId = await storageService.uploadFileToGridFS(fileBuffer, repoName, commitMessage);
                        console.log(`Successfully read ${nodeName}. Size: ${fileBuffer.length} bytes`);
                        //store into db
                        await Node.create({
                            repoId:repoId,
                            commitId:commitId,
                            parentNodeId:parentNodeId,
                            name:nodeName,
                            type:'file',
                            gridFSFileId:gridFSFileId
                        })
                        console.log(gridFSFileId)

                    }
                    catch(err){
                        console.error(`Error occured! ${err}`);
                        res.status(500).send('Server error D:')
                    }
                                    
                } catch (error) {
                    console.error(`Error reading entry ${nodeName}:`, error);
                    // Force the stream to finish processing this entry and move on
                    entry.autodrain(); 
                }
            });

            // Resolve/Reject the main promise when unzipping is done
            unzipperStream.on('close', resolve);
            unzipperStream.on('error', reject);
        });

        fileProcessingPromises.push(zipPromise);
    });

    // --- C. Wait for All Processing to Finish ---
    bb.on('close', async () => {
        try {
            // Wait for Busboy to finish AND all file processing promises to resolve
            //then create commit, finally create repo
            await Promise.all(fileProcessingPromises);
            const newCommit = await Commit.create({
                id:commitId,
                repoId:repoId,
                message:commitMessage,
                author:userId,
                parentCommitId:null,
            })
            commits.push(commitId)

            const newRepo = await Repository.create({
                _id:repoId,
                name:repoName,
                owner:userId,
                commits:commits
            })

            //update user
            await User.findByIdAndUpdate(userId,
                {$push: {repoList:repoId}}
                
            )
            if (!res.headersSent) {
                console.log('\nAll files processed successfully.');
                res.status(200).json({ 
                    message: 'Upload and processing complete', 
                    repoName:repoName,
                    commitMessage:commitMessage,
                    userId:userId
                });
            }
        } catch (error) {
            console.error('Final processing failure:', error);
            if (!res.headersSent) {
                res.status(500).send('An error occurred during zip file processing.');
            }
        }
    });

    // 6. Pipe the incoming request stream to Busboy to start parsing
    req.pipe(bb);

}


// Fix: Prevent duplicate folder creation by caching and locking folder paths.
// Ensures concurrent uploads wait for the same folder creation instead of making duplicates.
const folderCache = new Map<string, Types.ObjectId>();
const folderLocks = new Map<string, Promise<Types.ObjectId>>();

async function ensureFolders(repoId: Types.ObjectId, commitId: Types.ObjectId, entryPath: string) {
    entryPath = entryPath.replace(/\\/g, "/").replace(/\/$/, "");
    const parts = entryPath.split("/").filter(Boolean);
    if (parts.length <= 1) return null;

    let currentPath = "";
    let parentNodeId: Types.ObjectId | null = null;

    for (let i = 0; i < parts.length - 1; i++) {
        const name = parts[i];
        currentPath = `${currentPath}${currentPath ? '/' : ''}${name}`;

        if (folderCache.has(currentPath)) {
            parentNodeId = folderCache.get(currentPath)!;
            continue;
        }

        // Wait if another ensureFolders call is already creating this folder
        if (folderLocks.has(currentPath)) {
            parentNodeId = await folderLocks.get(currentPath)!;
            continue;
        }

        // Create a new lock
        const lockPromise = (async ():Promise<Types.ObjectId> => {
            let existing:INode|null = await Node.findOne({ repoId, commitId, parentNodeId, name, type: "folder" });
            if (!existing) {
                console.log("Creating new folder:", { name, parentNodeId });
                existing = await Node.create({
                    repoId,
                    commitId,
                    parentNodeId,
                    name,
                    type: "folder",
                    gridFSFileId: null,
                });
            }
            folderCache.set(currentPath, existing._id);
            folderLocks.delete(currentPath);
            return existing._id;
        })();

        folderLocks.set(currentPath, lockPromise);
        parentNodeId = await lockPromise;
    }

    return parentNodeId;
}

export const getReposController = async (req: Request, res: Response): Promise<Response> => {
    try {
        const currentUser = await User.findById(req.params.userId)
            .populate('repoList'); // This returns full IRepository objects

        if (!currentUser) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // The returned value is an array of full IRepository documents (due to populate)
        // We ensure the type is correctly asserted for the return line
        const repoList = currentUser.repoList as unknown as IRepository[]; 
        console.log(repoList);
        return res.status(200).json(repoList);

    } catch (error) {
        console.error("Error fetching repositories:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const repoViewController = async(req:Request, res:Response):Promise<Response>=>{
    const userId = req.params.userId;
    const requestedRepoId = req.params.repoId;

    if(!userId){
        return res.status(400).json("No userId provided!")
    }
    if(!requestedRepoId){
        return res.status(400).json("No repoId provided!")
    }
    //returns nodes of current user, of latest commit, whose parentId = repoId
    const user = await User.findById(userId);
    if(!user){
        return res.status(400).json("Requested user does not exist")
    }
    const repoList = user.repoList; 

    const requiredRepoId = repoList.find(repoId=> repoId.toString() === requestedRepoId);
    if(!requiredRepoId){
        return res.status(400).json("Repository does not belong to user/does not exist!");
    }

    const repo = await Repository.findById(requiredRepoId)
    console.log(repo)
    if(!repo){
        return res.status(400).json("Repository does not exist in repository collection!")
    }
    const latestCommitId = (repo!.commits).at(-1);
    const repoRoot:INode|null = await Node.findOne({commitId:latestCommitId, parentId:null})

    if(!repoRoot){
        return res.status(400).json("Root node for repository not found!")
    }
    console.log(repoRoot)
    const nodes = await Node.find({commitId:latestCommitId,parentNodeId:repoRoot!._id})
    return res.status(200).json(nodes)


}
//could merge above and this in future, for now lets keep these 2 seperate
export const getNodesController = async(req:Request,res:Response):Promise<Response>=>{
    const userId = req.params.userId;
    const requestedCommitId = req.params.commitId;
    const requestedNodeId = req.params.nodeId;

    if(!userId){
        return res.status(400).json("No userId provided!")
    }
    if(!requestedNodeId){
        return res.status(400).json("No nodeId provided!")
    }
    //returns nodes of current user, of latest commit, whose parentId = repoId
    const user = await User.findById(userId);
    if(!user){
        return res.status(400).json("Requested user does not exist")
    }

    const nodes = await Node.find({commitId:requestedCommitId,parentNodeId:requestedNodeId!})
    return res.status(200).json(nodes)
}