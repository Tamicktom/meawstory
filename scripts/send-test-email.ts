//* Sends one real email through Resend: bun run email:test person@example.com
//* Local imports
import { deliverWithResend } from "@/services/email"

const to = process.argv[2]

if (!to) {
  console.error("Usage: bun run email:test person@example.com")
  process.exit(1)
}

const body =
  "Este é um e-mail de teste do Meawstory."

await deliverWithResend({
  to,
  subject: "Teste de envio do Meawstory",
  html: `<p>${body}</p>`,
  text: body,
})

console.log(`Sent to ${to}.`)
