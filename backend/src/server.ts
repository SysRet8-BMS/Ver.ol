import 'dotenv/config'; // Loads the .env variables
import express from 'express'
import type {Application, Request, Response} from 'express';
import cors from 'cors'
import {connectDB, conn} from './config/db.js'

import {initGridFS} from './config/multer.js';
import {repoRouter} from './routes/repoRoutes.js';

// Initialize DB and GridFS
await connectDB();
await initGridFS(conn); // Wait for GridFS to be initialized

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Replace: app.use(cors());

// With this specific configuration:
const corsOptions = {
    // 1. Specify the EXACT origin of your frontend dev server
    origin: 'http://localhost:5173', 
    
    // 2. Allow all common methods used in REST APIs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    
    // 3. Allow essential headers (Content-Type is crucial for JSON posts)
    allowedHeaders: ['Content-Type', 'Authorization'],
    
    // 4. Critical for preflight success (sets Access-Control-Max-Age)
    // This tells the browser to cache the preflight result for 1 day (86400 seconds)
    maxAge: 86400,
}

app.use(cors(corsOptions));
// Middleware
app.use(express.json()); // to parse json bodies such as commit messages
app.use(express.urlencoded({extended: true})); // to handle url-encoded data


// Health Check route
app.get('/', (req: Request, res: Response) => {
    res.send('VCS Backend is running. Status: OK');
});


// Main API Routes
app.use('/app/repo', repoRouter); // mounting repo routes


// Starting Server
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));