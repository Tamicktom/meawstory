//* Libraries imports
import { expect, test, type Page } from "@playwright/test"

//* Local imports
import {
  linkIn,
  verificationSubject,
  waitForEmails,
} from "../helpers/email-outbox"
import { savedCorrection } from "../helpers/saved-correction"
import { signIn } from "../helpers/sign-in"

const themeId = "theme_key_on_the_table"
const scene = "A chave ficou na mesa entre as duas. ".repeat(15).trim()
const blockedCopy =
  "Confirme seu e-mail para receber a leitura. Sua cena está salva."

async function writeAndSubmit(page: Page) {
  await page.goto(`/dashboard/exercises/${themeId}/write`)

  const editor = page.locator("#scene-content")

  await expect(editor).toBeVisible()
  await editor.click()
  await page.keyboard.press("ControlOrMeta+A")
  await page.keyboard.insertText(scene)
  await page.getByRole("button", { name: "Enviar para leitura" }).click()
  await page
    .getByRole("button", { name: "Confirmar envio", exact: true })
    .click()
  //* The first request after a server start also compiles the route.
  await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
    timeout: 30_000,
  })
}

test.describe("email verification", () => {
  test("sends a confirmation email in Portuguese on sign up", async ({
    page,
  }) => {
    const account = await signIn(page)
    const [email] = await waitForEmails(account.email, verificationSubject)

    expect(email!.text).toContain("Confirmar e-mail")
    expect(email!.text).toContain("24 horas")
  })

  test("blocks the reading, keeps the scene, and releases it after confirming", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    const account = await signIn(page)

    await writeAndSubmit(page)

    const sceneUrl = page.url()

    await expect(page.getByText(blockedCopy)).toBeVisible()
    await expect(page.getByText(scene)).toBeVisible()
    await expect(page.locator("#start-reading")).toHaveCount(0)

    const blocked = await page.request.post(
      `/api/correction/start/${sceneUrl.split("/").at(-1)}`
    )

    expect(blocked.status()).toBe(403)

    await page.getByRole("button", { name: "Reenviar e-mail" }).click()
    await expect(page.getByRole("status")).toContainText(account.email)

    //* The second email carries this scene as the return address.
    const emails = await waitForEmails(account.email, verificationSubject, 2)

    await page.goto(linkIn(emails.at(-1)!))

    await expect(page).toHaveURL(sceneUrl)
    await expect(page.getByText(scene)).toBeVisible()
    await expect(page.getByText(blockedCopy)).toHaveCount(0)

    await page.getByRole("button", { name: "Receber a leitura" }).click()

    await expect(page.getByText(savedCorrection.opening)).toBeVisible({
      timeout: 45_000,
    })
    await page.getByText("Ver pontuação total", { exact: true }).click()
    await expect(page.getByText("Pontuação: 640 de 1000")).toBeVisible()
    await expect(page.getByText(scene)).toBeVisible()
  })

  test("reopens a saved draft, edits it and sends the same scene", async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await signIn(page)
    await writeAndSubmit(page)
    const sceneUrl = page.url()
    await page.getByRole("link", { name: "Continuar escrevendo" }).click()
    const editor = page.getByRole("textbox", { name: "Sua cena" })
    await expect(editor).toHaveValue(scene)
    const revised = scene + "\n\nA porta fechou."
    await editor.fill(revised)
    await page.getByRole("button", { name: "Enviar para leitura" }).click()
    await page
      .getByRole("button", { name: "Confirmar envio", exact: true })
      .click()
    await expect(page).toHaveURL(sceneUrl)
    await expect(page.getByText(revised)).toBeVisible()
    await page.goto("/dashboard/texts")
    await expect(
      page.locator(`a[href="${new URL(sceneUrl).pathname}"]`)
    ).toHaveCount(1)
  })

  test("signing in stays open to an unverified account", async ({ page }) => {
    await signIn(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  })

  test("a bad link returns to the scene and offers a new email", async ({
    page,
  }) => {
    await signIn(page)
    await writeAndSubmit(page)

    const scenePath = new URL(page.url()).pathname

    await page.goto(
      `/api/auth/verify-email?token=bad-token&callbackURL=${encodeURIComponent(scenePath)}`
    )

    await expect(page).toHaveURL(new RegExp(`${scenePath}\\?error=`))
    await expect(page.getByText("expirou ou não é mais válido")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Reenviar e-mail" })
    ).toBeVisible()
  })
})
