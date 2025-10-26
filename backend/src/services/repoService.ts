import Repository from '../models/repository.js';
import { type ICommit } from '../models/commit.js';
import {Types} from 'mongoose';

// Add a new commit to a specified repo, create one if it doesn't exist.
export const addNewCommit = async (repoName: string, commitData: ICommit, ownerId: Types.ObjectId) => {
    const repository = await Repository.findOneAndUpdate(
        {name: repoName},
        {
            $push: {commits: commitData},
            $setOnInsert: {owner: ownerId}
        },
        {
            new: true, // return the updated doc
            upsert: true // create doc if it doesn't exist
        }
    );

    return repository;
}