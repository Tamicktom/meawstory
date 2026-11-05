import { describe, expect, it } from "bun:test"
import {
  signInErrorMessage,
  signUpErrorMessage,
} from "@/lib/auth-error-message"

describe("localized authentication errors", () => {
  it.each([
    { status: 401 },
    { status: 400, code: "INVALID_EMAIL_OR_PASSWORD" },
  ])("explains invalid credentials for %j", (error) => {
    expect(signInErrorMessage(error)).toBe("E-mail ou senha incorretos.")
  })

  it.each(["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"])(
    "offers account recovery for %s",
    (code) => {
      expect(signUpErrorMessage({ status: 422, code })).toBe(
        "Já existe uma conta com esse e-mail. Entre na sua conta ou recupere a senha."
      )
    }
  )

  it("prioritizes rate limiting over the sign-in error code", () => {
    expect(
      signInErrorMessage({ status: 429, code: "INVALID_EMAIL_OR_PASSWORD" })
    ).toBe("Foram muitas tentativas. Aguarde um minuto e tente de novo.")
  })

  it("prioritizes rate limiting over the sign-up error code", () => {
    expect(
      signUpErrorMessage({ status: 429, code: "USER_ALREADY_EXISTS" })
    ).toBe("Foram muitas tentativas. Aguarde um minuto e tente de novo.")
  })

  it.each([
    { status: 500 },
    { status: 400, code: "UNKNOWN_ERROR", message: "Internal server details" },
  ])("keeps unknown sign-in errors generic for %j", (error) => {
    expect(signInErrorMessage(error)).toBe(
      "Não foi possível entrar agora. Tente de novo em instantes."
    )
  })

  it.each([
    { status: 500 },
    { status: 400, code: "UNKNOWN_ERROR", message: "Internal server details" },
  ])("keeps unknown sign-up errors generic for %j", (error) => {
    expect(signUpErrorMessage(error)).toBe(
      "Não foi possível criar sua conta agora. Tente de novo em instantes."
    )
  })
})
