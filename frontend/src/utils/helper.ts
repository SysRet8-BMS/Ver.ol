import type {UINode, Change} from '../types'
import {authFetch} from './authFetch'
import { useRepoStore } from "../store/repoStore";
import {useTerminalStore} from '../store/terminalStore';

const BASE_URL = import.meta.env.VITE_BASE_URL

export function findNodeHelper(nodes:UINode[],id: string): UINode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    if (node.children) {
      const found = findNodeHelper(node.children,id);
      if (found) return found;
    }
  }
  return null;
}

export async function appendChildrenNodes(node: UINode) {
  const { appendChildren } = useRepoStore.getState();

  // Don't refetch if already populated
  if (node.children && node.children.length > 0) {
    console.log(`Skipping fetch for ${node.name} - already has ${node.children.length} children`);
    return;
  }

  console.log(`Fetching children for ${node.name} (ID: ${node._id}, Commit: ${node.commitId})`);
  const res = await authFetch(`${BASE_URL}/app/repo/api/${node.commitId}/${node._id}`);
  const children = await res.json();

  console.log(`Received ${children.length} children for ${node.name}:`, children.map((c: UINode) => c.name));
  appendChildren(node._id, children);
  console.log("after running appendChildren: ",node);
}

export function findcwdNode(pwd: string): UINode | null {
  const { mode, nodes, stagedNodes} = useRepoStore.getState();

  console.log('stagedNodes inside findcwdNode function',stagedNodes);
  // compute visible nodes reactively
  const visibleNodes = mode === "staging" ? stagedNodes : nodes;

  console.log('visibleNodes inside findcwdNodes',visibleNodes,' mode',mode)
  // handle root
  const pathParts = pwd.split('/').filter(Boolean);
  if(pathParts.length === 0) return null;

  // start at root folder
  let cwdNode = visibleNodes.find((n:UINode)=>n.type==='folder' && n.parentNodeId===null);
  if (!cwdNode) return null;

  // walk down the path
  for (let i = 1; i < pathParts.length; i++) {
    cwdNode = cwdNode.children?.find(
      n => n.type === 'folder' && n.name === pathParts[i]
    );
    if (!cwdNode) return null;
  }

  return cwdNode;
}

export function listAll(pwd:string){
    const cwdNode = findcwdNode(pwd);
    if (!cwdNode) return 'Invalid pwd path';
    if (!cwdNode.children || cwdNode.children.length === 0) return '(empty folder)';

    console.log('cwdNode in list all', cwdNode)
    return cwdNode.children
        .map(child => child.type==='folder' ? child.name.concat('/'):child.name)
        .join('\n');
}

export async function cwd(pwd: string, directory: string){
    if(directory === '..'){
      const pathParts =  pwd.split('/').filter(Boolean);
      const parentPath = pathParts.slice(0,-1).join('/');
      useTerminalStore.setState({pwd:parentPath});
      return `Switched back to ${parentPath}`
    }
    const cwdNode = findcwdNode(pwd);
    if (!cwdNode) return 'Invalid pwd path';
    //first find dir in children of cwdNode
    //if dir exists, set pwd,load its children
    const dir = cwdNode.children?.find(child=>child.type==='folder' && child.name===directory);
    if(!dir) return `${directory} not found!`;
    useTerminalStore.setState({pwd:`${pwd}/${dir.name}`});
    //load dir's children too, only if it doesnt exist

    if(!dir.children){
      console.log(dir);
      console.log(`${dir.name} has no children!`)
      await appendChildrenNodes(dir)
    };

    return `Changed directory to ${dir.name}`
}

// Helper to recursively update the tree for rename
function renameInTree(nodes: UINode[], oldNode: UINode, newName: string): UINode[] {
    return nodes.map(n => {
      if (n._id === oldNode._id) {
        return { ...n, name: newName };
      }
      if (n.children) {
        return { ...n, children: renameInTree(n.children, oldNode, newName) };
      }
      return n;
    });
}

export function renameHelper(oldName: string, newName: string) {
  const mode = useRepoStore.getState().mode;
  if (mode !== "staging") return "Please switch to staging mode!";
  if (!oldName || !newName) return "Invalid arguments, must provide valid name";

  const pwd = useTerminalStore.getState().pwd;
  const currWorkingDir = findcwdNode(pwd);
  if (!currWorkingDir) return "Error retrieving current working directory!";

  if (currWorkingDir.children?.some(child => child.name === newName))
    return `${newName} already exists!`;

  const oldNode = currWorkingDir.children?.find(child => child.name === oldName);
  if (!oldNode) return `${oldName} not found!`;

  const stagedNodes = structuredClone(useRepoStore.getState().stagedNodes);
  const updatedNodes = renameInTree(stagedNodes, oldNode, newName);

  useRepoStore.setState({ stagedNodes: updatedNodes });

  const stagedChanges = useRepoStore.getState().stagedChanges;
  const change: Change = {
    type: "rename",
    nodeId: oldNode._id,
    payload: { oldName,newName },
  };
  useRepoStore.setState({ stagedChanges: [...stagedChanges, change] });

  return `${oldName} renamed to ${newName}`;
}

// Helper to recursively move a node in the tree
function moveInTree(
  nodes: UINode[],
  srcNode: UINode,
  oldParentId: string,
  newParentId: string
): UINode[] {
  return nodes.map(node => {
    // Remove src from old parent's children
    if(node._id === srcNode._id){
      return {
        ...node,parentNodeId:newParentId
      }
    }
    if (node._id === oldParentId) {
      return {
        ...node,
        children: moveInTree(node.children!.filter(c => c._id !== srcNode._id), srcNode, oldParentId, newParentId),
      };
    }

    // Add src to new parent's children with updated parentNodeId
    if (node._id === newParentId) {
      const movedNode: UINode = { 
        ...srcNode, 
        parentNodeId: newParentId 
      };
      const updatedChildren = moveInTree(node.children!, srcNode, oldParentId, newParentId); //matching a parent folder so not null
      return {
        ...node,
        children: [...(updatedChildren || []), movedNode],
      };
    }

    // Recursively process children
    if (node.children && node.children.length > 0) {
      return { 
        ...node, 
        children: moveInTree(node.children, srcNode, oldParentId, newParentId) 
      };
    }

    return node;
  });
}

export async function move(src: string, dest: string) {
  console.log('src: ',src,'dest: ',dest)
  const mode = useRepoStore.getState().mode;
  if (mode !== "staging") return "Please switch to staging mode!";
  if (!src || !dest) return "Invalid input";

  const pwd = useTerminalStore.getState().pwd;
  const currWorkingDir = findcwdNode(pwd);
  if (!currWorkingDir) return "Error retrieving current working directory!";

  const srcNode = currWorkingDir.children?.find(n => n.name === src);
  if (!srcNode) return `${src} not found in current directory!`;


  if(dest === '..'){
    const destNodeId = currWorkingDir.parentNodeId;
    if(!destNodeId) return 'Cannot move to parent of root directory!';
    const stagedNodes = structuredClone(useRepoStore.getState().stagedNodes);

    const destNode = stagedNodes.find(node=>node._id === destNodeId);
    if(!destNode) return `Error while moving to parent directory of ${src}`;
    console.log('staged nodes inside move',stagedNodes)
    const finalNodes = moveInTree(stagedNodes, srcNode, currWorkingDir._id, destNodeId);

    useRepoStore.setState({ stagedNodes: finalNodes });
    console.log('finalNodes after moving',finalNodes);
    const stagedChanges = useRepoStore.getState().stagedChanges;
    const change: Change = {
      type: "move",
      nodeId: srcNode._id,
      payload: { src:srcNode.name,dest:destNode.name,newParentId: destNode._id },
    };
    useRepoStore.setState({ stagedChanges: [...stagedChanges, change] });

    return `Moved ${src} to ${destNode.name}`;
  }
  const destNode = currWorkingDir.children?.find(
    n => n.type === "folder" && n.name === dest
  );
  if (!destNode) return `${dest} not found or is not a folder in current directory!`;

  if (srcNode._id === destNode._id) {
    return "Cannot move a folder into itself!";
  }

  if (destNode.children?.some(child => child.name === srcNode.name)) {
    return `${srcNode.name} already exists in ${dest}!`;
  }

  if(!destNode.children || destNode.children.length == 0) await appendChildrenNodes(destNode)
  const stagedNodes = structuredClone(useRepoStore.getState().stagedNodes);
  console.log('staged nodes inside move',stagedNodes)
  const finalNodes = moveInTree(stagedNodes, srcNode, currWorkingDir._id, destNode._id);

  useRepoStore.setState({ stagedNodes: finalNodes });
  console.log('finalNodes after moving',finalNodes);
  const stagedChanges = useRepoStore.getState().stagedChanges;
  const change: Change = {
    type: "move",
    nodeId: srcNode._id,
    payload: { src:srcNode.name,dest:destNode.name,newParentId: destNode._id },
  };
  useRepoStore.setState({ stagedChanges: [...stagedChanges, change] });

  return `Moved ${src} to ${dest}/`;
}
function deleteInTree(nodes: UINode[], nodeId: string, parentId: string): UINode[] {
  return nodes
    .filter(node => node._id !== nodeId) // Remove the node itself if found at this level
    .map(node => {
      // Remove from parent's children
      if (node._id === parentId) {
        return {
          ...node,
          children: node.children?.filter(c => c._id !== nodeId),
        };
      }

      // Recursively process children
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: deleteInTree(node.children, nodeId, parentId),
        };
      }

      return node;
    });
}
export function delHelper(nodeName: string) {
  const mode = useRepoStore.getState().mode;
  if (mode !== "staging") return "Please switch to staging mode!";
  if (!nodeName) return 'Invalid arguments';

  const pwd = useTerminalStore.getState().pwd;
  const currWorkingDir = findcwdNode(pwd);
  if (!currWorkingDir) return 'Invalid pwd path';

  const toBeDeletedNode = currWorkingDir.children?.find(node => node.name === nodeName);
  if (!toBeDeletedNode) return `${nodeName} not found!`;

  // Deep clone to avoid mutations
  const stagedNodes = structuredClone(useRepoStore.getState().stagedNodes);

  // Use recursive helper
  const updatedNodes = deleteInTree(stagedNodes, toBeDeletedNode._id, currWorkingDir._id);

  useRepoStore.setState({ stagedNodes: updatedNodes });

  console.log('After deleting', useRepoStore.getState().stagedNodes);

  const stagedChanges = useRepoStore.getState().stagedChanges;
  const change: Change = {
    type: "delete",
    nodeId: toBeDeletedNode._id,
    payload:{deletedNodeName: toBeDeletedNode.name}
  };
  useRepoStore.setState({ stagedChanges: [...stagedChanges, change] });

  console.log(useRepoStore.getState().stagedChanges);
  return `Deleted ${nodeName}`;
}

// Helper to add a new node to the tree
function addNodeToTree(nodes: UINode[], newNode: UINode, parentId: string): UINode[] {
  return nodes.map(node => {
    // Add new node to parent's children
    if (node._id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }

    // Recursively process children
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addNodeToTree(node.children, newNode, parentId),
      };
    }

    return node;
  });
}

export function createHelper(fileName: string) {
  const mode = useRepoStore.getState().mode;
  if (mode !== "staging") return "Please switch to staging mode!";
  if (!fileName || fileName.trim() === '') return 'Invalid arguments: please provide a file name';

  const pwd = useTerminalStore.getState().pwd;
  const currWorkingDir = findcwdNode(pwd);
  if (!currWorkingDir) return 'Invalid pwd path';

  // Check if file already exists
  if (currWorkingDir.children?.some(child => child.name === fileName)) {
    return `${fileName} already exists in current directory!`;
  }

  const { repoId, commitId } = useRepoStore.getState();

  // Create a temporary node ID (will be replaced by backend)
  const tempNodeId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new node
  const newNode: UINode = {
    _id: tempNodeId,
    repoId,
    commitId,
    parentNodeId: currWorkingDir._id,
    name: fileName,
    type: 'file',
    gridFSFileId: null,
    timestamp: new Date(),
    children: undefined,
  };

  // Deep clone to avoid mutations
  const stagedNodes = structuredClone(useRepoStore.getState().stagedNodes);

  // Add new node to tree
  const updatedNodes = addNodeToTree(stagedNodes, newNode, currWorkingDir._id);

  useRepoStore.setState({ stagedNodes: updatedNodes });

  console.log('After creating', useRepoStore.getState().stagedNodes);

  // Add to staged changes
  const stagedChanges = useRepoStore.getState().stagedChanges;
  const change: Change = {
    type: "create",
    nodeId: tempNodeId,
    payload: { 
      fileName,
      parentNodeId: currWorkingDir._id
    }
  };
  useRepoStore.setState({ stagedChanges: [...stagedChanges, change] });

  console.log('CREATE CHANGE ADDED:', change);
  console.log('Current working directory ID:', currWorkingDir._id);
  console.log('Current working directory name:', currWorkingDir.name);
  console.log('All staged changes:', useRepoStore.getState().stagedChanges);
  return `Created ${fileName}`;
}