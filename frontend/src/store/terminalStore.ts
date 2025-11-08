import { create } from "zustand";
import { useRepoStore } from "./repoStore";
import { useAuthStore } from "./authStore";
import {listAll,cwd,renameHelper, move, delHelper} from '../utils/helper'

interface TerminalState {
  repoName: string;
  pwd: string;
  awaitingInput: boolean;
  inputPrompt?: string;
  awaitingDiscardConfirm:boolean;

  onInput?: (input: string) => string;
  setRepo: (repoName: string) => void;
  getPwd:()=>string;
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
      const {getPwd} = get();
      return getPwd();
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
      const {getPwd} = get();
      const pwd = getPwd();
      const output = listAll(pwd);
      return output;
    },

    cd: async (directory: string) => {
      const awaitDiscardConfirm = get().awaitingDiscardConfirm;
      if(awaitDiscardConfirm) return '';
      const {getPwd} = get();
      const pwd = getPwd();
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
        useRepoStore.getState().setMode(modeVal);

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



    help: () =>
      "Available commands: pwd, whoami, echo, ls, cd, mode, mv,rename,delete, help",
    
  },

}));
