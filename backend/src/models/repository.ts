import mongoose, {Schema, Document, Model, Types} from 'mongoose';

// import the embedded scheme in commit.ts
import {type ICommit, CommitSchema} from './commit.js';

// interface: defines the overall structure for the repository
export interface IRepository extends Document {
    name: String;
    owner: Types.ObjectId; // reference to the user who owns the repo
    commits: ICommit[]; // array of version snapshots
}

const RepositorySchema: Schema<IRepository> = new Schema ({
    name: {
        type: String,
        required: true,
        unique: true, // repo names are unique for a given user
        trim: true, 
        index: true // indexing allows us to search repos by name
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    commits: {
        type: [CommitSchema]
    }
},
{
    timestamps: true
});

const Repository: Model<IRepository> = mongoose.model<IRepository> ('Repository', RepositorySchema);
export default Repository;



/*  
    **Some remarks**

    This structure makes the repository name the unique identifier. Storing the commits as an array 
    of embedded documents i.e. Schema of Schema ensures that the commit history is fetched with a 
    single, fast lookup.
    This makes it ideal for the application's performance :)    
*/