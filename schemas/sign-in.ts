//* Libraries imports
import { z } from "zod"

//* Local imports
import { passwordSchema } from "@/schemas/password"

const signInSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: passwordSchema,
})

type SignInValues = z.infer<typeof signInSchema>

const signInDefaultValues: SignInValues = {
  email: "",
  password: "",
}

export { signInDefaultValues, signInSchema }
export type { SignInValues }
