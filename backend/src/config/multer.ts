import multer from 'multer';
import 'dotenv/config';
import { Connection, mongo } from 'mongoose';

// GridFS Bucket instance for streaming operations
let gfs: mongo.GridFSBucket;

// Initialize GridFS Bucket using mongoose connection
const initGridFS = (conn: Connection): void => {
    conn.once('open', () => {
        gfs = new mongo.GridFSBucket(conn.db!, { bucketName: 'repo_files' });
    });
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