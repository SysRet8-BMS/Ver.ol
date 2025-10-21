import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {Link} from 'react-router'

export default function SignUp(){
    return (
        <div className="w-full max-w-md">
            <form>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="username">Username</FieldLabel>
                        <Input id="username" autoComplete="off" aria-invalid />
                        <FieldError>Choose another username.</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input type="email" id="email" autoComplete="off" aria-invalid placeholder="example@example.com"/>
                        <FieldError>Please enter a valid email!</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="pswrd">Enter your password</FieldLabel>
                        <Input type="password" id="pswrd" autoComplete="off" aria-invalid/>
                        <FieldError>Please enter a valid password</FieldError>
                    </Field>

                    <Field orientation="horizontal">
                        <Button type="submit">Sign up</Button>
                    </Field>

                    <p>Already have an account ? <Link to="/login">Login</Link></p>
            </FieldGroup>

            </form>
        </div>
               
    );
}