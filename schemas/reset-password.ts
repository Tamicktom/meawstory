//* Libraries imports
import { z } from "zod"

//* Local imports
import { passwordMaxLength, passwordMinLength } from "@/schemas/password"

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        passwordMinLength,
        `A senha precisa ter pelo menos ${passwordMinLength} caracteres`
      )
      .max(
        passwordMaxLength,
        `A senha pode ter no máximo ${passwordMaxLength} caracteres`
      ),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não são iguais",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

const resetPasswordDefaultValues: ResetPasswordValues = {
  password: "",
  confirmPassword: "",
}

export { resetPasswordDefaultValues, resetPasswordSchema }
export type { ResetPasswordValues }
