import Commit from "../models/commit.js";
import Node from "../models/node.js";
import Repository from "../models/repository.js";
import { Types } from "mongoose";
import type { Change } from "../types.js";
import { createNode, renameNode, moveNode, deleteNodeAndDescendants, updateNode } from "./nodeService.js";
import { uploadFileToGridFS } from "./storageService.js";

export const createCommit = async(
    _id: Types.ObjectId,
    repoId: Types.ObjectId,
    authorId: Types.ObjectId,
    message: string,
    timestamp: Date,
    parentCommitId?: Types.ObjectId | null
) => {
    const commitId = new Types.ObjectId;
    const newCommit = await Commit.create({
        _id: commitId,
        repoId,
        author: authorId,
        message,
        parentCommitId: parentCommitId || null,
        timestamp: Date.now()
    })

    await Repository.findByIdAndUpdate(repoId, {$push: {commits: newCommit}});
    

    return newCommit;
};

export const applyChangesToNewCommit = async(
    repoId: Types.ObjectId,
    newCommitId: Types.ObjectId,
    parentCommitId: Types.ObjectId,
    changes: Change[]
) => {
    const parentCommitNodes = await Node.find({commitId: parentCommitId});

    // map all the old nodeId's with the new ones
    const idMap = new Map<string, Types.ObjectId>();
    for(const node of parentCommitNodes) {
        const newNodeId = new Types.ObjectId();
        idMap.set(node._id.toString(), newNodeId);
    }

    // create new nodes using createNode function
    const newNodes = [];
    for(const node of parentCommitNodes) {
        const newNode = await createNode({
            repoId,
            commitId: newCommitId,
            parentNodeId: node.parentNodeId ? idMap.get(node.parentNodeId.toString()) || null : null,
            name: node.name,
            type: node.type,
            gridFSFileId: node.gridFSFileId,
            timestamp: new Date()
        });

        // store the created node with its mapped ID
        idMap.set(node._id.toString(), newNode._id);
        newNodes.push(newNode);
    }

    // apply changes using nodeService functions
    for(const change of changes) {
        const newNodeId = idMap.get(change.nodeId);
        if(!newNodeId) continue; // node doesn't exist

        if(change.type === "rename" && "newName" in change.payload) {
            await renameNode(newNodeId, change.payload.newName);
        }

        if(change.type === "move") {
            const newParentId = idMap.get(change.payload.newParentId);
            if(newParentId) {
                await moveNode(newNodeId, newParentId);
            }
        }

        if(change.type === "delete") {
            await deleteNodeAndDescendants(newNodeId);
        }

        if(change.type === "edit") {
            // Convert string content to buffer for GridFS upload
            const newFileContent = change.payload.newContent;
            const fileBuffer = Buffer.from(newFileContent, 'utf-8');
            const stringifiedRepoId = repoId as unknown as string;
            const newGridFSFileId = await uploadFileToGridFS(fileBuffer, stringifiedRepoId);
            await updateNode(newNodeId, newGridFSFileId);
        }
    }

    return newNodes;
}

export const getCommitHistory = async(repoId: Types.ObjectId) => {
    return await Commit.find(repoId).populate('author', 'username email').sort({timeStamp: -1});
}

