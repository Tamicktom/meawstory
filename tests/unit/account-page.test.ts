//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import AccountPage from "@/app/(app)/dashboard/account/page"
import { db } from "@/database"
import { user } from "@/database/schema"
import { openSession } from "@/tests/helpers/open-session"

const headerBox = {
  current: new Headers(),
}
const sessions: Array<{ close: () => Promise<void> }> = []

let restoreHeaders = () => {}

beforeEach(() => {
  headerBox.current = new Headers()

  const headersSpy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => headerBox.current as never
  )

  restoreHeaders = () => {
    headersSpy.mockRestore()
  }
})

afterEach(async () => {
  restoreHeaders()

  for (const session of sessions) {
    await session.close()
  }

  sessions.length = 0
})

async function signIn() {
  const session = await openSession()
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

async function accountOf(userId: string) {
  const [account] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))

  if (!account) {
    throw new Error("Missing account")
  }

  return account
}

async function loadPage() {
  return renderToStaticMarkup(await AccountPage())
}

async function expectRedirectToSignIn() {
  let thrown: unknown

  try {
    await AccountPage()
  } catch (error) {
    thrown = error
  }

  expect((thrown as { digest?: string }).digest).toContain("/sign-in")
}

describe("AccountPage", () => {
  it("redirects to sign in when there is no session", async () => {
    await expectRedirectToSignIn()
  })

  it("shows the signed-in person's name and email and offers sign out", async () => {
    const session = await signIn()
    const account = await accountOf(session.userId)
    const markup = await loadPage()

    expect(markup).toContain("Conta")
    expect(markup).toContain("Nome")
    expect(markup).toContain("E-mail")
    expect(markup).toContain(`id="account-name"`)
    expect(markup).toContain(account.name)
    expect(markup).toContain(`id="account-email"`)
    expect(markup).toContain(account.email)
    expect(markup).toContain('id="account-sign-out"')
    expect(markup).toContain('type="button"')
    expect(markup).toContain("Sair")
    expect(markup).not.toContain("<input")
    expect(markup).not.toContain("<form")
    expect(markup).not.toContain("Excluir conta")
    expect(markup).not.toContain("Exportar")
  })

  it("keeps another person's name and email off the page", async () => {
    const session = await signIn()
    const other = await openSession()
    sessions.push(other)
    const account = await accountOf(session.userId)
    const someoneElse = await accountOf(other.userId)
    const markup = await loadPage()

    expect(markup).toContain(account.name)
    expect(markup).toContain(account.email)
    expect(markup).not.toContain(someoneElse.name)
    expect(markup).not.toContain(someoneElse.email)
  })
})
