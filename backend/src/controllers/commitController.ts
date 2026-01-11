import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import type {ICommit} from '../models/commit.js';
import type { Change } from '../types.js';
import Repository from '../models/repository.js'
import User from '../models/user.js'
import Commit from '../models/commit.js'
import Node from '../models/node.js'

import type {AuthenticatedRequest} from '../models/user.js'
import { createCommit, applyChangesToNewCommit } from '../services/commitService.js';

export const getCommitHistoryController = async(req: Request, res: Response): Promise<Response> => {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq?.user.id;

    if(!userId) {
        return res.status(401).json({msg: "User Id not found in session"});
    }

    const repoId = req.params.repoId;
    const tempRepoId = repoId as unknown as Types.ObjectId;

    // verify if the repo belongs to the user, if it's a valid userId
    const user = await User.findById(userId);
    if(!user?.repoList.includes(tempRepoId))
        return res.status(403).json({msg: "Access Denied"});

    // get repo and populate it with the array of commits along with author details
    const repo = await Repository.findById(repoId)
    .populate({
        path: 'commits', // populate the commits array
        populate: { path: 'author', select: 'username email' } // then populate each commit's author
    })
    .populate({
        path: 'owner', // optionally also populate the repo owner
        select: 'username email'
    });


    if(!repo) {
        return res.status(404).json({msg: "Repository not found!"});
    }

    // returns the array of commits if repository exists
    return res.status(200).json({commits: repo.commits});
};
export const commitController = async(req: Request, res: Response): Promise<Response> => {
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;

    console.log('Commit request received');
    console.log('User ID:', userId);
    console.log('Request body:', req.body);

    if(!userId) {
        return res.status(401).json({msg: "User ID is not in session"});
    }

    const { commitId, stagedChanges, repoId, message } = req.body;

    console.log('Parsed values:', { commitId, stagedChanges, repoId, message });

    // Validate commitId
    let parentCommitId: Types.ObjectId;
    try {
        parentCommitId = new Types.ObjectId(commitId)
    } catch (err) {
        return res.status(400).json({ error: "Invalid commitId" });
    }

    // Validate repoId
    let repoObjectId: Types.ObjectId;
    try {
        repoObjectId = new Types.ObjectId(repoId);
    } catch (err) {
        return res.status(400).json({ error: "Invalid repoId" });
    }

    // Verify if the repo belongs to the user
    const user = await User.findById(userId);
    if(!user?.repoList.includes(repoObjectId)) {
        return res.status(403).json({ msg: "Access Denied" });
    }

    // Validate staged changes
    if (!Array.isArray(stagedChanges)) {
        return res.status(400).json({ error: "stagedChanges must be an array" });
    }
    const requestedChanges: Change[] = stagedChanges;

    // Verify parent commit exists
    const parentCommit = await Commit.findById(parentCommitId);
    if(!parentCommit) {
        return res.status(404).json({ error: "Parent commit not found" });
    }

    try {
        // Create new commit
        const newCommit = await createCommit(
            new Types.ObjectId(),
            repoObjectId,
            new Types.ObjectId(userId),
            message || "No message provided",
            new Date(),
            parentCommitId
        );

        // Apply changes to new commit
        await applyChangesToNewCommit(
            repoObjectId,
            newCommit._id,
            parentCommitId,
            requestedChanges
        );

        return res.status(201).json({ 
            msg: "Commit created successfully", 
            commit: newCommit 
        });
    } catch (error) {
        console.error("Error creating commit:", error);
        return res.status(500).json({ error: "Failed to create commit" });
    }
}
export const getCommitInfoController = async(req:Request,res:Response):Promise<Response>=>{
    const authReq = req as unknown as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if(!userId) {
        return res.status(401).json({msg: "User Id not found in session"});
    }
    const repoId = req.params.repoId;
    if(!repoId) return res.status(401).json({msg:"Missing repoId!"});
    const tempRepoId = repoId as unknown as Types.ObjectId;

    const commitId = req.params.commitId;
    if(!commitId) return res.status(401).json({msg:"Missing commitId!"})
    const tempCommitId = commitId as unknown as Types.ObjectId;

    //return json response with reponame, commit author, commit desc, commit author, and top level nodes of repo
    const repo = await Repository.findById(tempRepoId);
    if(!repo) return res.status(500).json({msg:" Requested repository not found!"});

    const reqCommit = await Commit.findById(tempCommitId);
    if(!reqCommit) return res.status(500).json({msg:" Requested commit not found!"})
    await reqCommit.populate('author');

    const repoRoot = await Node.findOne({
        commitId:tempCommitId,
        parentNodeId:null
    })
    if(!repoRoot) return res.status(500).json({msg:"Repository root not found!"});
    const nodes = await Node.find({
        commitId:tempCommitId,
        parentNodeId:repoRoot._id
    })
    return res.status(200).json({
        repoRoot:repoRoot,
        repoName:repo.name,
        commit:reqCommit,
        nodes:nodes
    })
}