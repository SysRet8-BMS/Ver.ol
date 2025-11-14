import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { authFetch } from '../utils/authFetch';
import { useRepoStore } from '../store/repoStore';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function deleteRepoAction({ params, context }: ActionFunctionArgs) {
    const { repoId } = params;
    
    if (!repoId) {
        throw new Error('no repo id given');
    }

    try {
        const response = await authFetch(
            `${BASE_URL}/app/repo/api/delete/${repoId}`,
            {
                method: 'DELETE',
            }
        );

        if (!response.ok) {
            const text = await response.text();
            console.error('Delete API error:', response.status, text);
            throw new Error(`Error with status code: ${response.status}`);
        }

        // Clear repo store to force refresh
        useRepoStore.getState().clearStore();

        // Return a redirect with router.revalidator call
        // This tells React Router to re-run all active loaders
        const router = context?.router;
        if (router) {
            router.revalidator.revalidate();
        }

        return redirect('/app');
    } catch (err) {
        console.error('Error in deleteRepoAction:', err);
        throw err;
    }
}
