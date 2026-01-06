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
  balance: z
    .number()
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
      createAccountMutation.mutate(values.value)
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
              <FieldGroup>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Balance
              </label>
              <div className="mt-1">
                <Input
                  type="number"
                  name="balance"
                  id="balance"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              </FieldGroup>
            </form>
          </DialogDescription>
        </DialogHeader>
          <DialogFooter>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <Button type="submit" className="w-full">
                Add Account
              </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog> 
    </>
	)
}
