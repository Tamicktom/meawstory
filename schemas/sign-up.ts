//* Libraries imports
import { z } from "zod"

//* Local imports
import { passwordSchema } from "@/schemas/password"

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Informe seu nome"),
    email: z.email("Informe um e-mail válido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não são iguais",
    path: ["confirmPassword"],
  })

type SignUpValues = z.infer<typeof signUpSchema>

const signUpDefaultValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

export { signUpDefaultValues, signUpSchema }
export type { SignUpValues }
