import mongoose, {Schema, Types, Model} from 'mongoose'

// Interface - Defines the required fields for a single snapshot of the project state
export interface ICommit {
    id: Types.ObjectId;
    repoId: Types.ObjectId;
    message: string;
    author: Types.ObjectId; // reference to the user who pushed the commit
    parentCommitId: Types.ObjectId|null;
    timestamp: Date;
}

// Schema - Defines the structure for an embedded document
export const CommitSchema = new Schema<ICommit> ({
    repoId: {
        type: Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    message: {
        type: String,
        required: false
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentCommitId: {
        type: Schema.Types.ObjectId,
        ref: 'Commit',
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now // don't call `now()` here, it's invoked at the time of commit through the constructor
    },

});
const Commit: Model<ICommit> = mongoose.model<ICommit> ('Commit', CommitSchema);
export default Commit;
/* 
    Some remarks:

    We make use of an embedded array (schema inside a schema) belong to one repository,
    which is highly efficient for fetching history.
*/
