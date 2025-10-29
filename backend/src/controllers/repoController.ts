import type { Request, Response } from 'express';
import * as storageService from '../services/storageService.js';
import * as repoService from '../services/repoService.js';
import { Types } from 'mongoose';
import { getGfs } from '../config/multer.js';
import { v4 as uuidv4 } from 'uuid';


// Replace this with the actual authenticated user ID later 
const AUTHOR_ID = new Types.ObjectId('60d5ec49c69d7b0015b8d28e');

// Extend Request to include file details from Multer's memoryStorage
export interface PushRequest extends Request {
    file: Express.Multer.File & {buffer: Buffer; };
}

export const pushCommit = async (req: Request, res: Response): Promise<void> => {

    const repoName = req.body.repoName;
    const commitMessage = req.body.commitMessage || 'No message provided';

    // check if file exists or is empty.
    const {buffer} = (req as PushRequest).file;
    if(!req.file || !buffer) {
        res.status(400).json({error: 'No repository zip was uploaded or file is empty'});
        return;
    }

    // check if the parameters include the repository name
    if(!repoName) {
        res.status(400).json({error: 'No repository name was provided for push operation'});
        return;
    }

    let gridFSFileId: Types.ObjectId | null = null;

    try {
        const fileBuffer = buffer;

        // save file to gridfs (io operation)
        gridFSFileId = await storageService.uploadFileToGridFS(fileBuffer, repoName, commitMessage);

        // prepare commit metadata
        const commitHash = uuidv4().substring(0, 8);
        const newCommitData = {
            id: commitHash, // string type
            author: AUTHOR_ID,
            message: commitMessage, // again a string
            timestamp: new Date(),
            gridFSFileId: gridFSFileId // ObjectId type
        }

        const repository = await repoService.addNewCommit(repoName, newCommitData, newCommitData.author);

        // if the response is a success
        res.status(201).json({
            message: 'Push Sucessful!',
            repo: repository.name,
            commit: newCommitData.id // or simply commitHash
        });
    }

    catch(error) {
        console.error(`Push Pipeline Failed:${error}`);

        // here we perform a rollback i.e. delete the file if metadata failed to save
        if(gridFSFileId) {
            try {
                const gfs = getGfs();
                await gfs.delete(gridFSFileId); // manual deletion of gridfs file
                console.warn(`Rollback successful: Deleted GridFs file ${gridFSFileId}`);
            }
            catch(cleanUpError) {
                console.error(`Critical error, failed to clean up gridfs file ${gridFSFileId}`, cleanUpError);
            }
        }

        // error response
        res.status(500).json({
            error: 'Server error during commit. Rollback attempted.',
            details: (error as Error).message
        });
    }
};

