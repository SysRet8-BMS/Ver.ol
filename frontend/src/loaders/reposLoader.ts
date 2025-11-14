import {authFetch} from '../utils/authFetch'
import {useAuthStore} from '../store/authStore';

const BASE_URL = import.meta.env.VITE_BASE_URL;
interface repo{
    id:string
    name:string,
    owner:string,
    commits: string[],
    createdAt: string; 
    updatedAt: string; 
    __v: number;
}
export async function reposLoader():Promise<repo[]> {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
        console.error("Userid is missing")
        throw new Response("Missing userId parameter", { status: 400 });
    }
    try{
        console.log(userId)
        const res = await authFetch(`${BASE_URL}/app/repo/api/repos`,{ 
            method: 'GET' 
        })
        if(!res.ok){
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const repos = await res.json();
        console.log(repos)
        return repos;
    }
    catch(error){
        console.error('Some error happened in the loader!',error);
        throw error;
    }

}
