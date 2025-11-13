import Node, { NodeSchema } from "../models/node.js";
import { Types } from "mongoose";

export const createNode = async (nodeData: {
    repoId: Types.ObjectId,
    commitId: Types.ObjectId,
    parentNodeId: Types.ObjectId | null,
    name: string,
    type: 'file' | 'folder',
    gridFSFileId?: Types.ObjectId | null,
    timestamp: Date
}) => {
    return await Node.create(nodeData);
};

export const getNodesByParent = async(
    // commitId: Types.ObjectId,
    parentNodeId: Types.ObjectId
) => {
    return await Node.find({parentNodeId});
};

export const renameNode = async(
    // commitId: Types.ObjectId,
    nodeId: Types.ObjectId,
    newName: string
) => {
    return await Node.findByIdAndUpdate(nodeId, {name: newName}, {new: true});
};


export const moveNode = async(
    // commitId: Types.ObjectId,
    nodeId: Types.ObjectId,
    newParentNodeId: Types.ObjectId
) => {
    return await Node.findByIdAndUpdate(nodeId, {parentNodeId: newParentNodeId}, {new: true});
};


// deletes the required file or folder along with all the files and subfolders
export const deleteNodeAndDescendants = async(
    // commitId: Types.ObjectId, 
    nodeId: Types.ObjectId
) => {
    // Get all descendants first and delete them
    const descendants = await findAllDescendants(nodeId);
    const descendantIds = descendants.map(node => node._id);
    await Node.deleteMany({_id: {$in: descendantIds}});
    
    // Delete the node itself
    await Node.findByIdAndDelete(nodeId);
    return {deleted: descendantIds.length + 1};
};


// helper function for the above to find the node and its descendants recursively 
export const findAllDescendants = async(
    // commitId: Types.ObjectId, 
    parentId: Types.ObjectId
) => {
    const children = await getNodesByParent(parentId);
    const descendants = [...children];

    // recursively call getNodesByParent to find all children
    for(const child of children) {
        const grandchildren = await getNodesByParent(child._id);
        descendants.push(...grandchildren);
    }

    return descendants;
};

export const updateNode = async (
    nodeId: Types.ObjectId,
    newGridFSFileId: Types.ObjectId
) => {
    return await Node.findByIdAndUpdate(
        nodeId, 
        {$set: {gridFSFileId: newGridFSFileId}},
        {new: true}
    );
};

