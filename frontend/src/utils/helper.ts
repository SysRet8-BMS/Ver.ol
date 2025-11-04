import type {UINode, Change} from '../types'
import {authFetch} from './authFetch'
import { useRepoStore } from "../store/repoStore";
import {useTerminalStore} from '../store/terminalStore';

const BASE_URL = import.meta.env.VITE_BASE_URL

export async function appendChildrenNodes(node:UINode){
    const {appendChildren} = useRepoStore.getState();
    const res = await authFetch(`${BASE_URL}/app/repo/api/${node.commitId}/${node._id}`);
    const children = await res.json();
    console.log(`Children of ${node.name}`,children)
    appendChildren(node._id, children);
}

export function findcwdNode(pwd: string): UINode | null {
  const { mode, nodes, stagedNodes} = useRepoStore.getState();

  // compute visible nodes reactively
  const visibleNodes = mode === "staging" ? stagedNodes : nodes;
  console.log('visibleNodes', visibleNodes)

  // handle root
  const pathParts = pwd.split('/').filter(Boolean);
  console.log(pathParts)
  if(pathParts.length === 0) return null;
  // split and remove empty parts (caused by leading "/")

  // start at root folder
  let cwdNode = visibleNodes.find((n:UINode)=>n.type==='folder' && n.parentNodeId===null);
  if (!cwdNode) return null;//should never happen

  // walk down the path
  for (let i = 1; i < pathParts.length; i++) {
    cwdNode =
      cwdNode.children?.find(
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

    return cwdNode.children
        .map(child => child.type==='folder' ? child.name.concat('/'):child.name)
        .join('\n');
}
export async function cwd(pwd: string, directory: string){
    if(directory === '..'){
      const pathParts =  pwd.split('/').filter(Boolean);
      const parentPath = pathParts.slice(0,-1).join('/');
      console.log('switched back to',parentPath);
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
    //load dir's children too
    await appendChildrenNodes(dir);

    return `Changed directory to ${dir.name}`

}

export function renameHelper(oldName:string,newName:string){
  const mode = useRepoStore.getState().mode;
  if(mode!=='staging') return 'Please switch to staging mode!';

  const pwd = useTerminalStore.getState().pwd; //returns pwd path
  const currWorkingDir = findcwdNode(pwd); //returns the currWorkingDir UI Node
  if(!currWorkingDir) return 'Error while retrieving current working directory!';

  //first check if there's node that already exists with this name
  const existingNode = currWorkingDir.children?.find(child=>child.name===newName);
  if(existingNode) return `${newName} already exists!`;

  const oldNode = currWorkingDir?.children?.find(child=>child.name===oldName);
  if(!oldNode) return `${oldName} not found!`;
  const stagedNodes = useRepoStore.getState().stagedNodes; //must use stagedNodes for rename operation

  const updatedNodes = stagedNodes.map(node=>{
    if(node.parentNodeId==currWorkingDir?._id&&node.name===oldName) return {...node,name:newName};
    return node;
  })
  useRepoStore.setState({stagedNodes:updatedNodes})
  const change:Change = {
    type:"rename",
    nodeId:oldNode._id,
    payload:{
      newName:newName
    }
  }
  const stagedChanges = useRepoStore.getState().stagedChanges;

  useRepoStore.setState({stagedChanges:[...stagedChanges,change]})
  console.log('Staged changes after renaming:',useRepoStore.getState().stagedChanges);
  return `${oldName} renamed to ${newName}`
}

export function buildTree(nodes: UINode[], parentId: string | null = null): UINode[] {
  return nodes
    .filter((n) => n.parentNodeId === parentId)
    .map((n) => ({
      ...n,
      children: buildTree(nodes, n._id),
    }));
}