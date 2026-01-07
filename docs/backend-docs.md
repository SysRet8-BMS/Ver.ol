# Ver.ol - Internal Technical Reference (Backend)

## Overview
- Ver.ol's backend implements a **Snapshot-based Version Control System** using MERN stack.
- Each commit captures the complete state of the repository at that point of time.
- This takes inspiration from Git's underlying architecture.
- The system(backend) currently supports CRUD operations on files/folders, repository management, accessing commit history and user authentication.
- All APIs follow RESTful design principle
- The backend architecture follows a modular design following MVCS(Model-View-Controller-Service) principles.


## Tech Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Storage**: GridFS for file storage
- **Authentication**: Passport.js (Local & JWT strategies)
- **File Processing**: Busboy, Unzipper
- **Language**: Typescript

## Architecture Principles

### 1. Snapshot-based Commits
Each commit represents a complete snapshot of the repository's file structure.  
Instead of storing diffs, we store:  
- All nodes(files and folders) for that commit
- References to file content in GridFS
- Parent-child relationships between nodes.

### 2. Immutable History
Commits and their nodes are immutable.
Creating a new commit:
1. Copies all the nodes from the parent commit.
2. Apply the requested changes (in the payload) to our copies.
3. Create new entries in GridFS for new/modified files.

### 3. Hierarchical Node Structure
- Files and folders are represented as nodes with parent-child relationships.
- This enables efficient tree traversal and operations.


## Data Models

**User:** `username | email | password | repoList[]`  
**Repository:** `repoId | name | owner | commits[]`  
**Commit:** `commitId | repoId | parentCommitId | message | author`  
**Node:** `nodeId | commitId | repoId | parentNodeId | name | type | gridFSFileId`


## Environment Configuration
- BACKEND_HOST/PORT   (Server Binding)
- FRONTEND_HOST/PORT  (CORS Whitelist)
- MONGO_URI (Database Connection)
- JWT_SECRET (Token signing key)

## System Configuration and Initialization

### Server Startup(Server.ts)
1. **Environment Setup**: Load `env` variables for configuration.
2. **Database connection**: Establish MongoDB connection using Mongoose.
3. **GridFS Bucket initialization**: Setup file storage system.
4. **CORS configuration**: Allow cross-origin requests from frontend.
5. **Middleware pipeline**: JSON parser -> URL-encoded parser -> Passport initialization
6. **Authenticated Setup**: Configure Local(login) and JWT(protected routes) strategies.
7. **Route Mounting**: Public auth routes + Protected repo routes
8. **Server Listen**: Start HTTP server on configured host and port.

### Database and Storage(db.ts, multer.ts)
- **MongoDB Connection**: Provides persistent document storage with relational capabilities with ObjectId references.
- **GridFS Setup**: Stores large(>16MB) with chunking(255KB chunks), returns a connection object for gridfs bucket creation.

### Authentication (passportConfig.ts)
1. **Local strategy**: Username + password validation with bcrypt comparison for login.
2. **JWT strategy**: token-based stateless authentication for API protection.


## Application Modules (MVCS Pattern)

### Services layer (holds business logic)
**nodeService.ts** - file/folder tree operations
- Atomic CRUD operations for hierarchical nodes.
- Recursive deletion propagates to all descendants.

**commitService.ts** - managing snapshot-based commits
- `createCommit()`: Generates new commit with a parent link
- `applyChangesToNewCommit()`: Implements copy-on-write for immutability
    - Clones all parent commit nodes
    - Creates ID Mapping (old->new)
    - Applies changes from payload: 
        - create/edit upload to gridFS
        - rename/move update metadata
        - delete removes subtrees

**storageService.ts** - GridFS Abstraction
- Streams file buffers to GridFS with UUID-based unique identifiers.
- Associates metadata(repo, commit message) with stored files.

**repoService.ts** - Repository Aggregation
- Upsert operations create/update repos atomically.


### Controllers Layer (Request Handling)

**AuthController.ts** - User Management
- Sign up: bcrypt hash passwords before storage
- Login: Passport Local Strategy validates credentials and issues JWT token.

**repoController.ts** - Upload Pipeline
- Busboy parses multipart zip uploads without full buffering.
- Unzipper extracts entries on the go.
- `ensureFolders()` creates parent directory nodes recursively.
- Parallel GridFS uploads + Node creation for each file

**commitController.ts** - Commit creation and handling
- Fetch commit metadata and commit history
- Creation of new commit
- Accept the "change" payload from frontend
- Delegates it to `commitService.applyChangesToNewCommit()`


### Routes Layer (API Endpoints)

**authRoutes.ts** - Public endpoints for user onboarding
**repoRoutes.ts** - JWT-protected endpoints for repo operations


## Design Choice
1. Snapshot-based commit model versus Delta-based
- Simplifies commit retrieval
- Avoids complex diff/merge algorithms
- Trade-off: Higher storage cost, but GridFS deduplication mitigates for unchanged files across commits.

2. MongoDB GridFS for file storage
- Document size limit for MongoDB(16MB) insufficient for large files
- Chunking enables streaming and efficient partial reads
- Trade-off: More complex than a traditional filesystem storage, but cloud-compatible.

3. JWT authentication
- Stateless authentication enables horizontal scaling
- Frontend can store token(localStorage in our case, or a cookie) for SPA navigation
- Trade-off: Cannot revoke tokens before expiry(workaround: a token blacklist)

4. Passport.js
- Abstracts authentication strategies
- Standardized `req.user` interface
- Trade-off: Additonal dependency, but saves boilerplate