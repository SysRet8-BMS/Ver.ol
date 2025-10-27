import multer from 'multer';
import 'dotenv/config';
import { mongo } from 'mongoose';
import type {Connection} from 'mongoose'

// GridFS Bucket instance for streaming operations
let gfs: mongo.GridFSBucket;

// Initialize GridFS Bucket using mongoose connection
const initGridFS = async (conn: Connection): Promise<void> => {
    // If connection is not open, wait for it
    if (conn.readyState !== 1) {
        await new Promise<void>((resolve) => {
            conn.once('open', () => resolve());
        });
    }
    
    // Now we can safely initialize GridFS
    gfs = new mongo.GridFSBucket(conn.db!, { bucketName: 'repo_files' });
    console.log(`GridFS Bucket Initialized.`);
};

const getGfs = (): mongo.GridFSBucket => {
    if(!gfs) 
        throw new Error("GridFS Bucket has not been initialized.");

    return gfs;
}

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
    storage: storage,
    // limits: {fileSize: 10*1024*1024} // optional
});

export {getGfs, initGridFS, uploadMiddleware};