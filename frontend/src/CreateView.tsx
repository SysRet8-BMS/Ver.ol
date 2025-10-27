import {Form} from 'react-router'
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
import { Textarea } from "@/components/ui/textarea"

import SubmitButton from "@/components/SubmitButton.tsx"

export default function CreateView(){
    return (
        //should be a form here to create a repo
        <div className="CreateView">
            <div className="font-bold text-4xl mb-10">Create a repository</div>
            <Form method="POST" encType="multipart/form-data">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="repoName">Repository Name</FieldLabel>
                        <Input id="repoName" name="repoName" autoComplete="off" />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="commitMessage">Enter commit message</FieldLabel>
                        <Textarea id="commitMessage" name="commitMessage" placeholder="Add repo description"/>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="zipfile">Upload repo</FieldLabel>
                        <Input type="file" id="zipfile" name="zipfile" accept=".zip,application/zip,application/x-zip-compressed"/>
                    </Field>
                    <Field orientation="horizontal">
                        <SubmitButton text={"Create repository"} />
                    </Field>
                </FieldGroup>
            </Form>
        </div>
    );
}