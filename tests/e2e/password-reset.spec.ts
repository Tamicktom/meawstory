//* Libraries imports
import { expect, test, type Page } from "@playwright/test"

//* Local imports
import {
  emailsTo,
  linkIn,
  passwordResetSubject,
  waitForEmails,
} from "../helpers/email-outbox"
import { registerAccount } from "../helpers/register-account"

const newPassword = "Nova!Senha123"

async function requestReset(page: Page, email: string) {
  await page.goto("/sign-in")
  await page.getByRole("link", { name: "Esqueci minha senha" }).click()
  await expect(page).toHaveURL("/forgot-password")
  await page.getByLabel("E-mail").fill(email)
  await page.getByRole("button", { name: "Enviar link" }).click()
  await expect(page.getByText("Confira seu e-mail")).toBeVisible()
}

async function submitNewPassword(page: Page) {
  await page.getByLabel("Nova senha", { exact: true }).fill(newPassword)
  await page.getByLabel("Confirme a nova senha").fill(newPassword)
  await page.getByRole("button", { name: "Salvar nova senha" }).click()
}

test.describe("password reset", () => {
  test("lets a person pick a new password and sign in with it", async ({
    page,
    request,
  }) => {
    const account = await registerAccount(request)

    await requestReset(page, account.email)

    const [email] = await waitForEmails(account.email, passwordResetSubject)
    const link = linkIn(email!)

    await page.goto(link)
    await expect(page).toHaveURL(/\/reset-password\?token=/)
    await submitNewPassword(page)
    await expect(page.getByText("Senha redefinida")).toBeVisible()

    await page.getByRole("link", { name: "Entrar" }).click()
    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha").fill(account.password)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(
      page.getByText("Não foi possível entrar", { exact: true })
    ).toBeVisible()

    await page.getByLabel("Senha").fill(newPassword)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page).toHaveURL("/dashboard")
  })

  test("refuses a link that was already used", async ({ page, request }) => {
    const account = await registerAccount(request)

    await requestReset(page, account.email)

    const [email] = await waitForEmails(account.email, passwordResetSubject)
    const link = linkIn(email!)

    await page.goto(link)
    await submitNewPassword(page)
    await expect(page.getByText("Senha redefinida")).toBeVisible()

    await page.goto(link)

    await expect(page.getByText("Este link não vale mais")).toBeVisible()
    await expect(page.locator("#reset-password-form")).toHaveCount(0)
  })

  test("refuses a made-up token submitted on the form", async ({ page }) => {
    await page.goto("/reset-password?token=made-up")
    await submitNewPassword(page)

    await expect(page.getByText("Este link não vale mais")).toBeVisible()
  })

  test("shows the invalid link state when the token is missing", async ({
    page,
  }) => {
    await page.goto("/reset-password")

    await expect(page.getByText("Este link não vale mais")).toBeVisible()
    await page.getByRole("link", { name: "Pedir um novo link" }).click()
    await expect(page).toHaveURL("/forgot-password")
  })

  test("answers the same way for an email with no account and sends nothing", async ({
    page,
  }) => {
    const unknownEmail = `e2e.${crypto.randomUUID()}@example.com`

    await requestReset(page, unknownEmail)

    expect(await emailsTo(unknownEmail)).toEqual([])
  })

  test("ends the sessions that were open", async ({
    page,
    browser,
    request,
  }) => {
    const account = await registerAccount(request)
    const otherDevice = await browser.newContext({
      baseURL: "http://localhost:3000",
    })
    const otherPage = await otherDevice.newPage()

    await otherPage.goto("/sign-in")
    await otherPage.getByLabel("E-mail").fill(account.email)
    await otherPage.getByLabel("Senha").fill(account.password)
    await otherPage.getByRole("button", { name: "Entrar" }).click()
    await expect(otherPage).toHaveURL("/dashboard")

    await requestReset(page, account.email)

    const [email] = await waitForEmails(account.email, passwordResetSubject)

    await page.goto(linkIn(email!))
    await submitNewPassword(page)
    await expect(page.getByText("Senha redefinida")).toBeVisible()

    await otherPage.goto("/dashboard")
    await expect(otherPage).toHaveURL("/sign-in")

    await otherDevice.close()
  })
})
