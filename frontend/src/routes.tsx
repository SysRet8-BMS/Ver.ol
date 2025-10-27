import LandingPage from './LandingPage.tsx'
import SignUp from './SignUp.tsx'
import Login from './Login.tsx'
import ErrorPage from './ErrorPage.tsx'
import ButtonList from './components/buttonList.tsx'
import Mainview from './Mainview.tsx'
import CreateView from './CreateView.tsx'
import RepoView , {repoLoader as loader} from './RepoView.tsx'
import {newRepoAction} from './actions/newRepoAction.ts'
import PrivateRoute from './PrivateRoutes.tsx'

let isAuthenticated = true; //some auth logic
const routes = [
    {
        path: "/",
        element: <LandingPage />,
        errorElement: <ErrorPage />,
        children :[
            {
                index:true,
                element: <ButtonList></ButtonList>
            },
            { 
                path: 'signup',
                element: <SignUp></SignUp>
            },
            {
                path: 'login',
                element: <Login></Login>
            },
        ],

    },
    {
        path:"/app",
        element: <PrivateRoute isAuthenticated={isAuthenticated} />,
        children:[
            {
                index:true,
                element: <Mainview /> //mainview
            },
            {
                path:"createview",
                element:<CreateView />,
                action: newRepoAction,
            },
            {
                path: "repoview/:repoId",
                element: <RepoView />,
                loader: loader,
                errorElement: <ErrorPage />,
            }
        ]
    }
]
export default routes;