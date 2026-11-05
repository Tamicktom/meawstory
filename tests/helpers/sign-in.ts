//* Libraries imports
import { request as playwrightRequest, type Page } from "@playwright/test"

//* Local imports
import {
  createSignUpAccount,
  type SignUpAccount,
} from "../factories/sign-up-account"

const baseURL = "http://localhost:3000"

export async function signIn(
  page: Page,
  overrides: Partial<SignUpAccount> = {}
): Promise<SignUpAccount> {
  const account = createSignUpAccount(overrides)
  const api = await playwrightRequest.newContext({ baseURL })

  try {
    const signUpResponse = await api.post("/api/auth/sign-up/email", {
      headers: {
        Origin: baseURL,
      },
      data: {
        name: account.name,
        email: account.email,
        password: account.password,
      },
    })

    if (!signUpResponse.ok()) {
      throw new Error(
        `Could not create the account for sign-in (${signUpResponse.status()}).`
      )
    }
  } finally {
    await api.dispose()
  }

  const signInResponse = await page.request.post("/api/auth/sign-in/email", {
    headers: {
      Origin: baseURL,
    },
    data: {
      email: account.email,
      password: account.password,
    },
  })

  if (!signInResponse.ok()) {
    throw new Error(`Could not sign in (${signInResponse.status()}).`)
  }

  return account
}
