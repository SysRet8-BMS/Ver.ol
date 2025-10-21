import LandingPage from './LandingPage.tsx'
import SignUp from './SignUp.tsx'
import Login from './Login.tsx'
import ErrorPage from './ErrorPage.tsx'
import ButtonList from './components/buttonList.tsx'

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
            }
        ]
    }
]
export default routes;