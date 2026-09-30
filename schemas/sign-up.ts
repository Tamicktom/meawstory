//* Libraries imports
import { z } from "zod"

//* Local imports
import { passwordSchema } from "@/schemas/password"

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
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
