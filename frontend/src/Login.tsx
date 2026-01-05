import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import SubmitButton from "@/components/SubmitButton.tsx"
import {Link, Form} from 'react-router-dom'
import {useAuthStore} from './store/authStore'

export default function Login(){
    const { loginState, statusMessage } = useAuthStore();

    return (
        <div className="w-full max-w-md bg-white p-10">
            <h1 className="font-bold text-4xl mb-4 text-center">Login</h1>

            <Form method="post">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="username">Username</FieldLabel>
                        <Input type="text" id="username" name="username" autoComplete="off" placeholder=""/>
                        {/* <FieldError>Please enter a valid email!</FieldError> */}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="pswrd">Enter your password</FieldLabel>
                        <Input type="password" id="pswrd" name="password" autoComplete="off"/>
                        {/* <FieldError>Please enter a valid password</FieldError> */}
                    </Field>

                    <Field orientation="horizontal">
                        <SubmitButton text="Login" />
                    </Field>
                    <p>Don't have an account ? <Link to="/signup">Sign up</Link></p>
                </FieldGroup>

            </Form>
            {loginState !== null && (
                <div className={`${loginState === 'error' ? 'text-red-500' : 'text-lime-500'} text-center mt-4 transition-all`}>
                    {statusMessage}
                </div>
            )}
        </div>
    );
}