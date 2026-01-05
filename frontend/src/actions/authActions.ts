import type {ActionFunctionArgs} from 'react-router'
import {redirect} from 'react-router'

const BASE_URL = import.meta.env.VITE_BASE_URL;
import {useAuthStore} from '../store/authStore'

export async function loginAction({ request }: ActionFunctionArgs){
    useAuthStore.setState({loginState:null, statusMessage:null})

    const formData = await request.formData();
    console.log(formData)
    const formEntries = formData.entries();
    const formObject = Object.fromEntries(formEntries);
    const formJSON = JSON.stringify(formObject)
    console.log(formJSON)
    try{
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: formJSON,
        });
        if(!response.ok){
            const errorData = await response.json();
            useAuthStore.setState({
                loginState: 'error', 
                statusMessage: errorData.message || 'An error occurred'
            });
            return;
        }

        const data = await response.json();
        console.log(data)
        useAuthStore.getState().login(data.token,data.user.id,data.user.userName);
        useAuthStore.setState({loginState:'success', statusMessage:'Successfully logged in. Happy contributing!...'})

        console.log('Successfully logged in. Happy contributing!...');
        return redirect('/app');
    }
    catch(err){
        console.error(err);
        useAuthStore.setState({
            loginState: 'error',
            statusMessage: err instanceof Error ? err.message : 'An unexpected error occurred'
        });
        return null;
    }
}
export async function signUpAction({ request }: ActionFunctionArgs){
    //set both to null at beginning
    useAuthStore.setState({signUpState:null, statusMessage:null})

    const formData = await request.formData();
    console.log(formData)
    const formEntries = formData.entries();
    const formObject = Object.fromEntries(formEntries);
    const formJSON = JSON.stringify(formObject)
    console.log(formJSON);

    try{
        const response = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: formJSON,
        });
        if(!response.ok){
            const errorData = await response.json();
            useAuthStore.setState({
                signUpState: 'error', 
                statusMessage: errorData.msg || 'An error occurred'
            });
            return;
        }
        useAuthStore.setState({signUpState:'success', statusMessage:'Successfully signed in. Redirecting to login page..'})

        console.log('Successfully signed in. Please login!');
        return;
    }
    catch(err){
        console.error(err);
        useAuthStore.setState({
            signUpState: 'error',
            statusMessage: err instanceof Error ? err.message : 'An unexpected error occurred'
        });
        return null;
    }

}