//* Libraries imports
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.email("Informe um e-mail válido"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const forgotPasswordDefaultValues: ForgotPasswordValues = {
  email: "",
}

export { forgotPasswordDefaultValues, forgotPasswordSchema }
export type { ForgotPasswordValues }
