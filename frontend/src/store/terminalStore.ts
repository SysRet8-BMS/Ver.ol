import { create } from "zustand";
import {useRepoStore} from './repoStore'
import {useAuthStore} from './authStore'

export type TerminalCommand = (...args: string[]) => string | Promise<string>;

type TerminalState = {
    repoName:string,
    pwd:string,
    mode:string,

    commands: Record<string, TerminalCommand>;
    setRepo:(repoName:string)=>void;
    clearStore: ()=>void;
}
export const useTerminalStore = create<TerminalState> ((set,get)=>({
    repoName:useRepoStore.getState().repoName,
    pwd:`/${useRepoStore.getState().repoName}`,
    mode:'viewing',
    setRepo: (repoName: string) => {
        set({
            repoName,
            pwd: `/${repoName}`,
        });
    },

    commands:{
        pwd:()=>get().pwd,
        whoami:()=>useAuthStore.getState().userName!,
        echo: (text: string) => text,
        ls: () => {
            const {pwd} = useTerminalStore.getState();
            console.log(pwd);
            const output = useRepoStore.getState().listAll(pwd);
            return output;
        },        // cd:(directory)=>useRepoStore.getState().cwd(), //no data mutation
        mv:(childNode, newParentNode)=>useRepoStore.getState().moveNode(childNode,newParentNode),
        help: () => "Available commands: pwd, whoami, echo,ls,cd,mv,rename,delete,stage,commit,help",


    },
    clearStore:()=>{
        set({mode:'viewing'})
    }
}))