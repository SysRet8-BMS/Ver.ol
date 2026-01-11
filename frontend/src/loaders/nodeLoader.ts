import {authFetch} from '../utils/authFetch'
const BASE_URL = import.meta.env.VITE_BASE_URL;
import type {LoaderFunctionArgs} from 'react-router'
import {useRepoStore} from '../store/repoStore'
import {useTerminalStore} from '../store/terminalStore'

//also pass the reporoot node along with its top level children
export async function repoNodesLoader({ params }: LoaderFunctionArgs){
    const {repoId, repoName} = params;
    if(repoId!= useRepoStore.getState().repoId){
        //navigating to different/initial repository
        console.log('in repoNodes loader',repoName)
        useRepoStore.getState().clearStore()
        useRepoStore.setState({repoId:repoId, repoName:repoName})
        useTerminalStore.getState().setRepo(repoName!)
        console.log('Navigating to new repo',repoName,repoId)
    }
    console.log('repository id:',repoId)
    
    useRepoStore.getState().setIsViewingCommit(false);
    useRepoStore.setState({commitNodes: []});  
    const nodes = useRepoStore.getState().nodes
    if(nodes && nodes.length > 0){
        return nodes.filter(node=>node.parentNodeId===repoId)
    }
    try{
        const res = await authFetch(`${BASE_URL}/app/repo/api/${repoId}`,{
            method: 'GET'
        });
        if(!res.ok){
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        const {repoRoot,repoNodes} = await res.json();
        console.log('the repo nodes',repoNodes)
        console.log('the root node: ',repoRoot)
        
        if (!repoRoot) {
            throw new Error('No repoRoot returned from backend');
        }
        
        // Set the current commit ID from the root node
        if (repoRoot.commitId) {
            useRepoStore.getState().setCommitId(repoRoot.commitId);
        }
        
        useRepoStore.getState().setNodes([...repoNodes,repoRoot])
        useRepoStore.getState().appendChildren(repoRoot._id,repoNodes);
        console.log('repoNodes in store',useRepoStore.getState().nodes)
        return useRepoStore.getState().nodes;//newly modified nodes
        
    }
    catch(error){
        console.error('Some error happened in the loader!',error);
        throw error;
    }
}