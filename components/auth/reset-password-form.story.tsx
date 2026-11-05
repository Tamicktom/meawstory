//* Components imports
import {
  InvalidResetLink,
  ResetPasswordForm,
} from "@/components/auth/reset-password-form"

export const Default = () => <ResetPasswordForm token="token-1" />

export const InvalidLink = () => <InvalidResetLink />
