"use client"

//* Components imports
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

//* Hooks imports
import { useFieldContext } from "@/components/auth/form-contexts"

//* Local imports
import { toFieldErrors } from "@/components/auth/field-errors"

type TextFieldProps = {
  id: string
  label: string
  type: "email" | "password" | "text"
  autoComplete: string
  disabled: boolean
}

function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>()
  const errors = toFieldErrors(field.state.meta.errors)
  const isInvalid = errors.length > 0

  return (
    <Field
      data-invalid={isInvalid || undefined}
      data-disabled={props.disabled || undefined}
    >
      <FieldLabel htmlFor={props.id}>{props.label}</FieldLabel>
      <Input
        id={props.id}
        name={field.name}
        type={props.type}
        autoComplete={props.autoComplete}
        value={field.state.value}
        disabled={props.disabled}
        aria-invalid={isInvalid || undefined}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
      />
      <FieldError errors={errors} />
    </Field>
  )
}

export { TextField }
