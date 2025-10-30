import type { Request, Response } from 'express';
import mongoose ,{ Types } from 'mongoose';
import busboy from 'busboy';
import unzipper from 'unzipper';

import * as storageService from '../services/storageService.js';
import * as repoService from '../services/repoService.js';
import { getGfs } from '../config/multer.js';


import type {IRepository} from '../models/repository.js'
import type {ICommit} from '../models/commit.js';

import Repository from '../models/repository.js'
import Commit from '../models/commit.js'

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
    let commits :ICommit[] = [];
    let repoId :Types.ObjectId;

    const fileProcessingPromises:Promise<void>[] = []; // To track async unzipping work
    const bb = busboy({headers: req.headers});

    bb.on('field', (key, value) => {
        if(key === 'repoName') {
            if(!value) res.status(200).send('Please enter valid repo name!')//probably shouldnt be status 200 though
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
                const fileName = entry.path;
                
                // Skip directories
                if (entry.type !== 'File') {
                    entry.autodrain(); 
                    return;
                }
                
                console.log(`Reading file inside zip: ${fileName}`);

                try {
                    // 4. Read the content of the single file
                    //store it in gridfs
                    const fileBuffer = await entry.buffer();
                    // **********************************************
                    // 5. PROCESS YOUR SINGLE FILE CONTENT HERE
                    // The contentBuffer holds the data for ONE file.
                    // **********************************************
                    let gridFSFileId: Types.ObjectId | null = null; //use it in nodes collection
                    try{
                        gridFSFileId = await storageService.uploadFileToGridFS(fileBuffer, repoName, commitMessage);
                        console.log(`Successfully read ${fileName}. Size: ${fileBuffer.length} bytes`);
                        console.log(gridFSFileId)

                    }
                    catch(err){
                        console.error(`Error occured! ${err}`);
                        res.status(500).send('Server error D:')
                    }
                                    
                } catch (error) {
                    console.error(`Error reading entry ${fileName}:`, error);
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
    bb.on('finish', async () => {
        try {
            // Wait for Busboy to finish AND all file processing promises to resolve
            //then create commit, finally create repo
            await Promise.all(fileProcessingPromises);
            repoId = new Types.ObjectId()
            const newCommit = await Commit.create({
                repoId:repoId,
                message:commitMessage,
                author:userId,
                parentCommitId:null,
            })
            commits.push(newCommit)

            const newRepo = await Repository.create({
                _id:repoId,
                name:repoName,
                owner:userId,
                commits:commits
            })
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

export const getReposController = async(req:Request, res:Response): Promise<void> =>{
    const repos = setTimeout(()=>{
        [
            {
                repoName:'my repo',
                repoId:'r1'
            }
        ]
    },2000)
    
    res.send(repos)
}
//requires heavy modification
// export const pushCommit = async (req: Request, res: Response): Promise<void> => {

//     const repoId = new Types.ObjectId();
//     const repoName = req.body.repoName;
//     const commitMessage = req.body.commitMessage || 'No message provided';

//     // check if file exists or is empty.
//     const {buffer} = (req as PushRequest).file;
//     if(!req.file || !buffer) {
//         res.status(400).json({error: 'No repository zip was uploaded or file is empty'});
//         return;
//     }

//     // check if the parameters include the repository name
//     if(!repoName) {
//         res.status(400).json({error: 'No repository name was provided for push operation'});
//         return;
//     }

//     let gridFSFileId: Types.ObjectId | null = null;

//     try {
//         const fileBuffer = buffer;

//         // save file to gridfs (io operation)
//         gridFSFileId = await storageService.uploadFileToGridFS(fileBuffer, repoName, commitMessage);

//         // prepare commit metadata
//         const commitId = new Types.ObjectId();
//         const newCommitData = {
//             id: commitId, 
//             repoId: repoId,
//             message: commitMessage, // again a string
//             parentCommitId:null, //first commit of repo
//             author: AUTHOR_ID,
//             timestamp: new Date(),
//         }

//         const repository = await repoService.addNewCommit(repoName, newCommitData, newCommitData.author);

//         // if the response is a success
//         res.status(201).json({
//             message: 'Push Sucessful!',
//             repo: repository.name,
//             commit: newCommitData.id // or simply commitHash
//         });
//     }

//     catch(error) {
//         console.error(`Push Pipeline Failed:${error}`);

//         // here we perform a rollback i.e. delete the file if metadata failed to save
//         if(gridFSFileId) {
//             try {
//                 const gfs = getGfs();
//                 await gfs.delete(gridFSFileId); // manual deletion of gridfs file
//                 console.warn(`Rollback successful: Deleted GridFs file ${gridFSFileId}`);
//             }
//             catch(cleanUpError) {
//                 console.error(`Critical error, failed to clean up gridfs file ${gridFSFileId}`, cleanUpError);
//             }
//         }

//         // error response
//         res.status(500).json({
//             error: 'Server error during commit. Rollback attempted.',
//             details: (error as Error).message
//         });
//     }
// };

