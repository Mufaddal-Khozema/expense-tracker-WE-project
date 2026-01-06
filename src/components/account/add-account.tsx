import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useForm } from '@tanstack/react-form'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useCreateAccount } from '@/hooks/use-create-account'
import * as z from 'zod'

const schema = z.object({
  name: z
    .string(),
  balance: z.number()
})

export const AddAccount = () => {
  const createAccountMutation = useCreateAccount()
  const form = useForm({
    defaultValues: {
      name: '',
      balance: 0,
    },
    validators: {
      onSubmit: schema, 
    },
    onSubmit: (values) => {
      createAccountMutation.mutate({type: "", ...values.value})
    },
  })
	return (<>
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            <form
              id="add-account-form"
              onSubmit={e => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="name"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field>
                        <FieldLabel htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name
                        </FieldLabel>
                        <Input
                          name={field.name}
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Cash, Savings, etc"
                          autoComplete="off"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                    </Field>
                    )
                  }}
                />

                <form.Field
                  name="balance"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field>
                        <FieldLabel htmlFor="balance" className="block text-sm font-medium text-gray-700">
                          Balance
                        </FieldLabel>
                        <Input
                          type="number"
                          name={field.name}
                          value={String(field.state.value)}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          aria-invalid={isInvalid}
                          placeholder="50000"
                          id="balance"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                    </Field>
                    )
                  }}
                />
              </FieldGroup>
            </form>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="mt-5 sm:mt-6 sm:gap-3 sm:grid-flow-row-dense">
            <Field>
              <Button type="submit" className="w-full" form="add-account-form">
                Add Account
              </Button>
            </Field>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog> 
    </>
	)
}
