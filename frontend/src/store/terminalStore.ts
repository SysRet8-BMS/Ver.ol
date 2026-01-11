import { create } from "zustand";
import { useRepoStore } from "./repoStore";
import { useAuthStore } from "./authStore";
import {listAll,cwd,renameHelper, move, delHelper, createHelper} from '../utils/helper'
import { createCommitAction } from "../actions/commitAction";
import { authFetch } from "../utils/authFetch";
import type {UINode} from '../types'

interface TerminalState {
  repoName: string;
  pwd: string;
  awaitingInput: boolean;
  inputPrompt?: string;
  awaitingDiscardConfirm:boolean;

  onInput?: (input: string) => string;
  setRepo: (repoName: string) => void;
  getPwd: ()=>string;
  setPwd:(pathName:string)=>void;
  defaultHandler:()=>string;
  commands: Record<string, (...args: string[]) => string | Promise<string>>;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  repoName: "",
  pwd: "",
  awaitingInput: false,
  inputPrompt: undefined,
  onInput: undefined,
  awaitingDiscardConfirm: false, 

  defaultHandler:()=>{
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';

      return 'command not found!'
  },
  setRepo: (repoName: string) => {
    set({
      repoName,
      pwd: `/${repoName}`,
    });
  },

  getPwd:()=>{
    const {pwd} = get();
    return pwd || localStorage.getItem('pwd')!;
  },
  
  setPwd:(pathName:string)=>{
    set({
      pwd:pathName
    })
    localStorage.setItem('pwd',pathName)
  },

  commands: {
    pwd: () => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';
      return get().pwd
    },

    whoami: () => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';

      return useAuthStore.getState().userName ?? "unknown"
    },

    echo: (text: string) => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';
      return text
    },

    ls: () => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return ''; //basically dont allow users to do stuff if waiting for confirmation
      const { pwd } = get();
      const output = listAll(pwd);
      return output;
    },

    cd: async (directory: string) => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';
      const { pwd } = get();
      const output = await cwd(pwd, directory);
      return output;
    },

    mode: (modeVal: string) => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';

      if (!modeVal) return useRepoStore.getState().mode;

      if (modeVal === "staging") {
        useRepoStore.getState().setMode(modeVal);
        set({ awaitingDiscardConfirm: false });
        return `Changed mode to: ${modeVal}`;
      }

      if (modeVal === "viewing") {
        // enter confirmation mode
        set({ awaitingDiscardConfirm: true });
        return "Discard currently staged changes? (y/n)";
      }

      return "Invalid mode value: must be 'staging' or 'viewing'";
    },
    mv: async (args:string) => {
      const [src, destRaw] = args.trim().split(/\s+/);
      const dest = destRaw?.trim().replace(/\s/g, '');
      
      console.log('Attempt to move ',src,' to ',dest);
      const output = await move(src,dest);
      return output;
    },
    rename:(args:string)=>{ //allows rename of nodes only in staging mode and nodes in present working directory
      const [oldName, newName] = args.trim().split(' ');
      console.log(oldName,newName)
      const output = renameHelper(oldName,newName)
      return output;
    },
    del:(arg:string)=>{
      const nodeName = arg.trim();
      return delHelper(nodeName);
    },
    create:(arg:string)=>{
      const fileName = arg.trim();
      return createHelper(fileName);
    },
    y: () => {
      const { awaitingDiscardConfirm } = get();
      if (!awaitingDiscardConfirm) return "command not found";

      set({ awaitingDiscardConfirm: false });
      useRepoStore.setState({ mode: "viewing" ,stagedChanges:[]}); //clear stagedChanges
      console.log('Staged changees after discarding',useRepoStore.getState().stagedChanges);
      return "Discarded changes, now in viewing mode";
    },
    n: () => {
      const { awaitingDiscardConfirm } = get();
      if (!awaitingDiscardConfirm) return "command not found";

      set({ awaitingDiscardConfirm: false });
      return "Cancelled, staying in staging mode";
    },

    commit: async (message: string) => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';

      const mode = useRepoStore.getState().mode;
      if (mode !== "staging") {
        return "Please switch to staging mode";
      }

      const { stagedChanges, repoId, commitId } = useRepoStore.getState();
      
      if (stagedChanges.length === 0) {
        return "No changes to commit!";
      }

      if (!commitId) {
        return "Error: No current commit ID found!";
      }

      if (!message) {
        return "Please provide a commit message: commit \"your message\"";
      }

      try {
        const result = await createCommitAction(commitId, stagedChanges, {
          repoId,
          message,
        });

        const newCommitId = result.commit._id;

        // Fetch nodes for the new commit from backend (it's now the latest commit)
        const BASE_URL = import.meta.env.VITE_BASE_URL;
        const response = await authFetch(`${BASE_URL}/app/repo/api/${repoId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch nodes:', errorText);
          throw new Error(`Failed to fetch nodes for new commit: ${response.status}`);
        }
        
        const { repoRoot, repoNodes } = await response.json();

        // Clear any expanded state and children to force fresh fetch
        const cleanNodes = [repoRoot, ...repoNodes].map((node: UINode) => ({
          ...node,
          isExpanded: false,
          children: undefined
        }));

        // Update the store with new commit data
        useRepoStore.setState({ 
          commitId: newCommitId,
          stagedChanges: [],
          mode: "viewing",
          nodes: cleanNodes,
          stagedNodes: []
        });
        
        // Update children for root node (only direct children from backend response)
        const rootChildren = repoNodes.map((node: UINode) => ({
          ...node,
          isExpanded: false,
          children: undefined
        }));
        useRepoStore.getState().appendChildren(repoRoot._id, rootChildren);

        return `Commit created successfully: ${newCommitId}\n${message}`;
      } catch (error) {
        console.error("Commit failed:", error);
        return `Commit failed: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },

    help: () =>
      "Available commands: pwd, whoami, echo, ls, cd, mode, mv, rename, del, create, commit, help",
    
  },

}));
