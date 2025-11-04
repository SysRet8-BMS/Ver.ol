import { create } from "zustand";
import type {UINode} from '../types'


type RepoState = {
  repoId:string,
  repoName:string,
  nodes: UINode[];
  setNodes: (nodes: UINode[]) => void;
  moveNode:(childNode:string,newParentNode:string)=>string,
  listAll:(pwd:string)=>string,
  appendChildren: (parentId: string, children: UINode[]) => void;
  toggleExpand: (nodeId: string) => void;
  clearStore: () => void;
};
function findcwdNode(pwd: string): UINode | null {
  const repoNodes = useRepoStore.getState().nodes;
  console.log('repoNodes', repoNodes)

  // handle root
  const pathParts = pwd.split('/').filter(Boolean);
  console.log(pathParts)
  if(pathParts.length === 0) return null;
  // split and remove empty parts (caused by leading "/")

  // start at root folder
  let cwdNode = repoNodes.find(n=>n.type==='folder' && n.parentNodeId===null);
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
export const useRepoStore = create<RepoState>((set) => ({
  repoId:'',
  repoName:'',
  nodes: [],

  setNodes: (nodes) => set({ nodes }),
  listAll: (pwd: string) => {
      const cwdNode = findcwdNode(pwd);
      if (!cwdNode) return 'Invalid pwd path';
      if (!cwdNode.children || cwdNode.children.length === 0) return '(empty folder)';

      return cwdNode.children
        .map(child => child.type==='folder' ? child.name.concat('/'):child.name)
        .join('\n');
    },

  moveNode:(childNode:string,parentNode:string)=>{
    //if file, set childNode parentId to parentNode id
    return `Moved ${childNode} to ${parentNode}`
  },

  appendChildren: (parentId, children) =>
    set((state) => {
      const attachChildren = (nodes: UINode[]): UINode[] =>
        nodes.map((n) => {
          if (n._id === parentId) {
            return {
              ...n,
              children: [...(n.children || []), ...children],
            };
          }
          if (n.children) {
            return { ...n, children: attachChildren(n.children) };
          }
          return n;
        });
      return { nodes: attachChildren(state.nodes) };
    }),

  toggleExpand: (nodeId) =>
    set((state) => {
      const toggle = (nodes: UINode[]): UINode[] =>
        nodes.map((n) => {
          if (n._id === nodeId) {
            return { ...n, isExpanded: !n.isExpanded };
          }
          if (n.children) {
            return { ...n, children: toggle(n.children) };
          }
          return n;
        });
      return { nodes: toggle(state.nodes) };
    }),

  clearStore: () => set({ nodes: [] }),
}));
