//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Services imports
import {
  passwordResetEmail,
  verificationEmail,
} from "@/services/email-templates"

const account = {
  name: 'Ada <script>alert("x")</script>',
  email: "ada@example.com",
  url: "https://meawstory.com/api/auth/verify-email?token=a&callbackURL=%2F",
}

describe.each([
  ["verificationEmail", verificationEmail, "Confirme seu e-mail no Meawstory"],
  ["passwordResetEmail", passwordResetEmail, "Redefina sua senha do Meawstory"],
] as const)("%s", (_name, build, subject) => {
  const email = build(account)

  it("addresses the account with a subject in Portuguese", () => {
    expect(email.to).toBe(account.email)
    expect(email.subject).toBe(subject)
  })

  it("carries the link in both versions", () => {
    expect(email.text).toContain(account.url)
    expect(email.html).toContain(account.url.replaceAll("&", "&amp;"))
  })

  it("escapes the name in the HTML", () => {
    expect(email.html).not.toContain("<script>")
    expect(email.html).toContain("&lt;script&gt;")
  })
})
