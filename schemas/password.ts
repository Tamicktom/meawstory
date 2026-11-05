//* Libraries imports
import { z } from "zod"

const passwordMinLength = 8
const passwordMaxLength = 128

const passwordSchema = z
  .string()
  .min(
    passwordMinLength,
    `A senha precisa ter pelo menos ${passwordMinLength} caracteres`
  )
  .max(
    passwordMaxLength,
    `A senha pode ter no máximo ${passwordMaxLength} caracteres`
  )

export { passwordMaxLength, passwordMinLength, passwordSchema }
