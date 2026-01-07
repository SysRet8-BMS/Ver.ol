# Ver.ol - Internal Technical Reference(Frontend)


## Core Idea & Design Motivation

Ver.ol is a simplified, Version Control System built as a web project.  
Instead of incremental diffs, it uses a snapshot-based commit model.

### Snapshot Model (Conceptual)
- Each commit represents a full repository snapshot
- Unchanged nodes are reused
- Modified files/folders create new nodes
- Deleted nodes simply do not exist in the new snapshot

---

## High-Level Architecture

- **Frontend**: React SPA with in-browser virtual filesystem + terminal
- **Backend**: Node.js + Express + MongoDB
- **Interaction Model**:
  - Users interact with repositories via:
    - Virtual File System (VFS UI)
    - Terminal-like interface (text-based commands)
  - Both interfaces ultimately call backend APIs

---

## Frontend Architecture

### Core Technologies
- React (SPA)
- Zustand (state management)
- React Router (routing + loaders + actions)

### Entry Points
- `main.tsx`: Application entry
- `routes.tsx`: Route definitions
  - React Router intercepts URL changes
  - Loads route-specific loaders
  - Renders components
  - Executes form actions when applicable

---

## Repository Interaction Model

Each repository view consists of:
- A **custom React terminal**
- A **Virtual File System (VFS)** tree

Users may use **either interface interchangeably**.

---

## State Management (Zustand Stores)

Zustand stores represent **isolated global state domains**.

### `authStore`
- Handles:
  - Login
  - Signup
  - Logout
- Stores auth token and user state

---

### `repoStore`

Manages repository interaction state.

#### Repository Modes
- **Viewing Mode**
- **Staging Mode**

#### Viewing Mode
- Uses `nodes`
- Folder expansion:
  - Expands lazily
  - API call fetches child nodes
  - Child nodes are appended to parent
- File click:
  - Triggers loader with `nodeId`
  - Backend returns file contents

#### Staging Mode
- Uses `stagingNodes`
- Tracks:
  - `stagedChanges`
  - Updated `stagingNodes` tree
- Every change:
  - Creates a new copy of `stagingNodes`
  - Required for React state updates
- On commit:
  - All staged changes are sent as JSON to backend
- Notes:
  - `stagingNodes` is for the UI-only
  - Backend never stores it directly

---

### `terminalStore`

Handles terminal-based repository interaction.\
Reference to terminal component: https://github.com/bony2023/react-terminal

- Uses **Bony2023’s React Terminal component**
- Terminal:
  - Accepts text input
  - Expects text output
- Commands:
  - Are wrappers over API calls
  - Some commands are restricted to staging mode:
    - `mv`, `rename`, `del`, `create`, `commit`
 
#### Command Behavior Notes
- `mv`
  - Only changes parent directory
- `rename`
  - Only renames file/folder
- Commands like `ls`, `cwd`, `commit`
  - Call helper functions
  - Helpers may call backend APIs

---

## VFS Tree Manipulation (Important)

UI nodes store children as **static lists**.

### Implication
If a deeply nested node changes:
- It must be updated in **every parent’s children list**
- Otherwise UI becomes inconsistent

### Solution
- Recursive helper functions (e.g. `moveInTree`)
- Traverse entire tree
- Update every instance of the affected node

---


## Utilities

### `/utils`

#### `authFetch`
- Wrapper over `fetch`
- Automatically attaches Bearer token
- Used for all authenticated frontend requests

#### `helpers`
- Shared helper functions for terminal commands
- Includes tree traversal logic and API wrappers

---

## Known Quirks & Workarounds

### `cd` Command Bug
- Initially, `cd` did not show directory contents unless folder was expanded first

**Cause**
- Folder expansion triggers backend call to load children
- `cd` originally did not

**Workaround**
- `cd` now:
  - Makes the same API call as folder expansion
  - Attaches children to the node
  - Displays contents

Effectively, `cd` **implicitly expands directories**.

---

## Known Issues / Technical Debt

### Misplaced Action
- `commitAction` is located in `/actions`
- `/actions` is meant only for React Router form actions
- Should be moved to `/utils`
  - Possibly renamed to `commitHandler`


