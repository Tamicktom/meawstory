//* Libraries imports
import { type APIRequestContext } from "@playwright/test"

//* Local imports
import {
  createSignUpAccount,
  type SignUpAccount,
} from "../factories/sign-up-account"

const origin = "http://localhost:3000"

export async function registerAccount(
  request: APIRequestContext,
  overrides: Partial<SignUpAccount> = {}
): Promise<SignUpAccount> {
  const account = createSignUpAccount(overrides)
  const response = await request.post("/api/auth/sign-up/email", {
    headers: {
      Origin: origin,
    },
    data: {
      name: account.name,
      email: account.email,
      password: account.password,
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Could not create the account (${response.status()}): ${await response.text()}`
    )
  }

  return account
}
