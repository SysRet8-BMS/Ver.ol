import {authFetch} from '../utils/authFetch'
import type {LoaderFunctionArgs} from 'react-router'
import {useRepoStore} from '../store/repoStore'

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function commitsLoader({ params }: LoaderFunctionArgs){
    const {repoId} = params;
    if(!repoId) throw Error('no repoId given!');

    console.log('repoId');

    try{
        const res = await authFetch(`${BASE_URL}/app/repo/api/getCommits/${repoId}`);
        if (!res.ok) throw new Error(`Error with status code: ${res.status}`);
        return res.json()
    }
    catch(error){
        console.error("Error occurred in the file loader!", error);
        throw error;
    }

}
export async function commitInfoLoader({params}:LoaderFunctionArgs){
    const {repoId, commitId} = params;
    if(!repoId) throw Error('Missing repoId');
    if(!commitId) throw Error('Missing commitId');

    try{
        const res = await authFetch(`${BASE_URL}/app/repo/api/commitInfo/${repoId}/${commitId}`)
        if(!res.ok){
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        const data = await res.json();
        console.log('data from response', data)
        const {repoRoot, repoName, commit, nodes} = data;
        //instead of changing nodes, set commitNodes, and in appendChildren use extra state of commitview
        useRepoStore.getState().setIsViewingCommit(true);
        useRepoStore.getState().setCommitNodes([...nodes,repoRoot])
        useRepoStore.getState().appendChildren(repoRoot._id,nodes);
        console.log('commit repoNodes in store',useRepoStore.getState().commitNodes)

        return {
            repoName,
            commit,
            nodes:useRepoStore.getState().commitNodes //use commitNodes instead
        }

    }
    catch(error){
        console.error('Some error happened in the commitInfoLoader!',error);
        throw error;
    }
}