//* Libraries imports
import { z } from "zod"

//* Local imports
import { passwordSchema } from "@/schemas/password"

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: passwordSchema,
})

type SignInValues = z.infer<typeof signInSchema>

const signInDefaultValues: SignInValues = {
  email: "",
  password: "",
}

export { signInDefaultValues, signInSchema }
export type { SignInValues }
