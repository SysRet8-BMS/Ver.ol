import {Schema, Types} from 'mongoose'

export interface INode {
    id: Types.ObjectId;
    repoId: Types.ObjectId;
    commitId: Types.ObjectId;
    parentNodeId: Types.ObjectId|null;
    name: string;
    type: 'file' | 'folder';
    gridFSFileId: Types.ObjectId|null;
    timestamp: Date;
}

export const NodeSchema = new Schema<INode> ({
    repoId: {
        type: Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    commitId: {
        type: Schema.Types.ObjectId,
        ref: 'Commit',
        required: true
    },
    parentNodeId: {
        type: Schema.Types.ObjectId,
        ref: 'Node',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
        required: true
    },
    gridFSFileId: {
        type: Schema.Types.ObjectId,
        ref: 'GridFSFile',
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});