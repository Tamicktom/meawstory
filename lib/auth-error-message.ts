type AuthError = {
  status: number
  code?: string
}

const rateLimitMessage =
  "Foram muitas tentativas. Aguarde um minuto e tente de novo."

export function signInErrorMessage(error: AuthError) {
  if (error.status === 429) return rateLimitMessage
  if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "E-mail ou senha incorretos."
  }
  return "Não foi possível entrar agora. Tente de novo em instantes."
}

export function signUpErrorMessage(error: AuthError) {
  if (error.status === 429) return rateLimitMessage
  if (
    error.code === "USER_ALREADY_EXISTS" ||
    error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
  ) {
    return "Já existe uma conta com esse e-mail. Entre na sua conta ou recupere a senha."
  }
  return "Não foi possível criar sua conta agora. Tente de novo em instantes."
}
