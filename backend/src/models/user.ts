// Note that Commit and Repository models reference user as the owner/author.

import mongoose, {Schema, Document, Model, Types} from 'mongoose';
// Interface - defines the typescript structure for the user doc.
export interface IUser extends Document {
    username: string;
    email: string;
    repoList: Types.ObjectId[];
    // will include authentication as a later feature
}

// Schema - Defines the MongoDB structure and rules
const UserSchema: Schema<IUser> = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 30 // tweak-able
    },

    email: {
        type: String,
        required: true,
        unique: true
    }
    ,
    repoList: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository', // Tells Mongoose which model to look up
            default:[]
    }]
}, 
{
    timestamps: true // to add 'createdAt' and 'updatedAt' fields
});

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;


