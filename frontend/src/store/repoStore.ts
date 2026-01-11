import { create } from "zustand";
import type {UINode, Change} from '../types'

//flag to be set if users are viewing their commits history, allows our frontend
//to decide which UI nodes to use based on this flag + mode
//action to set commitNodes so commitLoader can use it
interface RepoState {
  repoId: string;
  repoName: string;
  commitId: string;
  nodes: UINode[];
  stagedNodes: UINode[];
  commitNodes: UINode[];
  stagedChanges: Change[];
  mode: "viewing" | "staging";
  isViewingCommit:boolean;

  // actions
  setRepoInfo: (id: string, name: string) => void;
  setCommitId: (commitId: string) => void;
  setNodes: (nodes: UINode[]) => void;
  setMode: (mode: "viewing" | "staging") => void;
  setCommitNodes: (commitNodes: UINode[])=>void;
  setIsViewingCommit: (isViewingCommit:boolean)=>void;
  appendChildren: (parentId: string, children: UINode[]) => void;
  toggleExpand: (nodeId: string) => void;
  clearStore: () => void;
}

export const useRepoStore = create<RepoState>((set, get) => ({
  repoId: "",
  repoName: "",
  commitId: "",
  nodes: [],
  stagedNodes: [],
  commitNodes:[],
  stagedChanges: [],
  mode: "viewing",
  isViewingCommit:false,

  setRepoInfo: (id, name) => set({ repoId: id, repoName: name }),
  
  setCommitId: (commitId) => set({ commitId }),

  setNodes: (nodes) => set({ nodes }),
  setCommitNodes:(commitNodes) => set({commitNodes}),
  setMode: (mode) => {
    if (mode === "staging") {
      // Deep clone nodes into stagedNodes
      const cloned = structuredClone(get().nodes);
      set({ stagedNodes: cloned, mode });
    } else {
      set({ stagedNodes: [], mode });
    }
  },

  setIsViewingCommit(isViewingCommit: boolean){
    set({ isViewingCommit })
  },
  appendChildren: (parentId, children) =>
    set((state) => {
      const attachChildren = (nodes: UINode[]): UINode[] =>
        nodes.map((n) => {
          if (n._id === parentId) {
            return {
              ...n,
              children, // replace instead of append
            };
          }
          if (n.children) {
            return { ...n, children: attachChildren(n.children) };
          }
          return n;
        });
        let targetKey: keyof RepoState;

        if(state.isViewingCommit === true) targetKey = "commitNodes";
        else if (state.mode === "staging") targetKey = "stagedNodes";
        else targetKey = "nodes"

        console.log("Inside appendChildren in repoStore, targetKey",targetKey);
        return {
          [targetKey]: attachChildren(state[targetKey]),
        } as Partial<RepoState>;

  }),


  toggleExpand: (nodeId) =>
    set((state) => {
      const toggle = (nodes: UINode[]): UINode[] =>
        nodes.map((n) => {
          if (n._id === nodeId) {
            console.log('clicked node found!',n);
            return { ...n, isExpanded: !n.isExpanded };
          }
          if (n.children) {
            return { ...n, children: toggle(n.children) };
          }
          return n;
        });

        let targetKey: keyof RepoState;

        if(state.isViewingCommit === true) targetKey = "commitNodes";
        else if (state.mode === "staging") targetKey = "stagedNodes";
        else targetKey = "nodes"

      console.log('Inside toggleExpand, targetKey is',targetKey);
      return { [targetKey]: toggle(state[targetKey]) } as Partial<RepoState>;
    }),

  clearStore: () => set({ nodes: [], stagedNodes: [],commitNodes:[],mode:'viewing',stagedChanges: [], commitId: "" }),
}));
