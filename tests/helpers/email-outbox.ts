//* Libraries imports
import { expect, type Page } from "@playwright/test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

//* The dev server writes to this directory instead of calling Resend. See services/email.ts.
const outboxPath = path.join(process.cwd(), ".email-outbox")

type OutboxEmail = {
  to: string
  subject: string
  html: string
  text: string
}

async function emailsTo(address: string): Promise<OutboxEmail[]> {
  let files: string[]

  try {
    files = await readdir(outboxPath)
  } catch {
    return []
  }

  return Promise.all(
    files
      .filter((file) => file.startsWith(`${encodeURIComponent(address)}-`))
      .sort()
      .map(async (file) => {
        const content = await readFile(path.join(outboxPath, file), "utf8")

        return JSON.parse(content) as OutboxEmail
      })
  )
}

async function waitForEmails(
  address: string,
  subject: string,
  count = 1
): Promise<OutboxEmail[]> {
  const matching = async () =>
    (await emailsTo(address)).filter((email) => email.subject === subject)

  await expect.poll(async () => (await matching()).length).toBeGreaterThanOrEqual(count)

  return matching()
}

function linkIn(email: OutboxEmail): string {
  const link = email.text.match(/https?:\/\/\S+/)?.[0]

  if (!link) {
    throw new Error(`No link in the email "${email.subject}".`)
  }

  return link
}

const verificationSubject = "Confirme seu e-mail no Meawstory"
const passwordResetSubject = "Redefina sua senha do Meawstory"

async function confirmEmail(page: Page, address: string) {
  const [email] = await waitForEmails(address, verificationSubject)

  await page.goto(linkIn(email!))
}

export {
  confirmEmail,
  emailsTo,
  linkIn,
  passwordResetSubject,
  verificationSubject,
  waitForEmails,
}
