//* Libraries imports
import { z } from "zod"

const passwordMinLength = 8
const passwordMaxLength = 128

const passwordSchema = z
  .string()
  .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`)
  .max(passwordMaxLength, `Password must be at most ${passwordMaxLength} characters`)

export { passwordMaxLength, passwordMinLength, passwordSchema }
