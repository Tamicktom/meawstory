//* Libraries imports
import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resend } from "resend"

//* Local imports
import { serverEnv } from "@/env/server"

export type EmailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

const sender = "Meawstory <nao-responda@meawstory.com>"

export function emailOutboxPath() {
  return path.join(process.cwd(), ".email-outbox")
}

export async function deliverWithResend(
  message: EmailMessage,
  apiKey = serverEnv.RESEND_API_KEY
) {
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.")
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: sender,
    ...message,
  })

  if (error) {
    throw new Error(`Resend rejected the email: ${error.name}`)
  }
}

//* Local accounts use made-up addresses. Real sends to them would hurt the domain's reputation.
async function writeToOutbox(message: EmailMessage) {
  const directory = emailOutboxPath()
  const file = path.join(
    directory,
    `${encodeURIComponent(message.to)}-${Date.now()}-${randomUUID()}.json`
  )

  await mkdir(directory, { recursive: true })
  await writeFile(file, JSON.stringify(message, null, 2))

  if (process.env.NODE_ENV !== "test") {
    console.info(`[email] "${message.subject}" para ${message.to}: ${file}`)
  }
}

export async function sendEmail(message: EmailMessage) {
  if (process.env.NODE_ENV === "production") {
    await deliverWithResend(message)
    return
  }

  await writeToOutbox(message)
}
