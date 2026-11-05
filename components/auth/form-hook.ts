"use client"

//* Libraries imports
import { createFormHook } from "@tanstack/react-form"

//* Components imports
import { TextField } from "@/components/auth/text-field"

//* Local imports
import { fieldContext, formContext } from "@/components/auth/form-contexts"

const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
})

export { useAppForm }
