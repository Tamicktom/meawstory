//* Libraries imports
import { eq } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { user } from "@/database/schema"
import { clientEnv } from "@/env/client"
import { auth } from "@/lib/auth"
import { createSignUpAccount } from "@/tests/factories/sign-up-account"

type OpenSession = {
  userId: string
  headers: Headers
  close: () => Promise<void>
}

export async function openSession(): Promise<OpenSession> {
  const account = createSignUpAccount()
  const response = await auth.api.signUpEmail({
    body: {
      name: account.name,
      email: account.email,
      password: account.password,
    },
    headers: new Headers({
      origin: clientEnv.NEXT_PUBLIC_VERCEL_URL,
    }),
    asResponse: true,
  })

  if (!response.ok) {
    throw new Error(
      `Could not open a session (${response.status}): ${await response.text()}`
    )
  }

  const body = (await response.json()) as {
    user: {
      id: string
    }
  }
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ")

  return {
    userId: body.user.id,
    headers: new Headers({
      cookie,
    }),
    async close() {
      await db.delete(user).where(eq(user.id, body.user.id))
    },
  }
}
