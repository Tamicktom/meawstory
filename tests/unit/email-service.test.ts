//* Libraries imports
import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

//* Local imports
import { deliverWithResend, emailOutboxPath, sendEmail } from "@/services/email"

const message = {
  subject: "Assunto",
  html: "<p>Corpo</p>",
  text: "Corpo",
}

let restoreFetch = () => {}

afterEach(() => {
  restoreFetch()
  restoreFetch = () => {}
})

function recipient() {
  return `unit.${crypto.randomUUID()}@example.com`
}

function stubFetch(status: number, body: unknown) {
  const spy = spyOn(globalThis, "fetch").mockImplementation((async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch)

  restoreFetch = () => {
    spy.mockRestore()
  }

  return spy
}

async function outboxEmailsTo(to: string) {
  const directory = emailOutboxPath()
  const files = await readdir(directory)

  return Promise.all(
    files
      .filter((file) => file.startsWith(`${encodeURIComponent(to)}-`))
      .map(async (file) =>
        JSON.parse(await readFile(path.join(directory, file), "utf8"))
      )
  )
}

describe("sendEmail outside production", () => {
  it("writes to the outbox and does not call Resend", async () => {
    const fetchSpy = stubFetch(200, { id: "email-1" })
    const to = recipient()

    await sendEmail({ to, ...message })

    expect(await outboxEmailsTo(to)).toEqual([{ to, ...message }])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe("deliverWithResend", () => {
  it("sends from the no-reply address, with no reply address", async () => {
    const fetchSpy = stubFetch(200, { id: "email-1" })
    const to = recipient()

    await deliverWithResend({ to, ...message }, "re_test")

    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]

    expect(url).toBe("https://api.resend.com/emails")
    const body = JSON.parse(String(init.body))

    expect(body).toMatchObject({
      from: "Meawstory <nao-responda@meawstory.com>",
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    expect(body.reply_to).toBeUndefined()
  })

  it("throws when Resend refuses the email", async () => {
    stubFetch(422, {
      name: "validation_error",
      statusCode: 422,
      message: "Invalid `to` field",
    })

    await expect(
      deliverWithResend({ to: recipient(), ...message }, "re_test")
    ).rejects.toThrow("Resend rejected the email: validation_error")
  })

  it("refuses to send without a key", async () => {
    const fetchSpy = stubFetch(200, { id: "email-1" })

    await expect(
      deliverWithResend({ to: recipient(), ...message }, "")
    ).rejects.toThrow("RESEND_API_KEY is not set.")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
