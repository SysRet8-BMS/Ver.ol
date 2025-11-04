import type{UINode} from '../types'
import {authFetch} from './authFetch'
import { useRepoStore } from "../store/repoStore";
const BASE_URL = import.meta.env.VITE_BASE_URL

export async function appendChildrenNodes(node:UINode){
    const {appendChildren} = useRepoStore.getState();
    const res = await authFetch(`${BASE_URL}/app/repo/api/${node.commitId}/${node._id}`);
    const children = await res.json();
    console.log(`Children of ${node.name}`,children)
    appendChildren(node._id, children);
}