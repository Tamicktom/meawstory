//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { savedCorrection } from "../helpers/saved-correction"
import { confirmEmail } from "../helpers/email-outbox"
import { signIn } from "../helpers/sign-in"

const themeTitle = "A chave na mesa"
const themeId = "theme_key_on_the_table"
const submittedText = "A chave ficou na mesa entre as duas. ".repeat(15).trim()

test.describe("product loop", () => {
  test("walks from the theme list to the saved correction", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    const account = await signIn(page)

    await confirmEmail(page, account.email)
    await page.goto("/dashboard/themes")

    await page.getByRole("link", { name: themeTitle }).click()

    await expect(page).toHaveURL(`/dashboard/themes/${themeId}`)

    await page.getByRole("link", { name: "Escrever exercício" }).click()

    await expect(page).toHaveURL(`/dashboard/exercises/${themeId}/write`)

    const editor = page.locator("#scene-content")

    await expect(editor).toBeVisible()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+A")
    await page.keyboard.insertText(submittedText)
    await page.getByRole("button", { name: "Enviar para leitura" }).click()

    await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
      timeout: 45_000,
    })
    await expect(page.getByRole("heading", { name: themeTitle })).toBeVisible()
    await expect(page.getByText(savedCorrection.content)).toBeVisible()
    await expect(page.getByText("Nota 640 de 1000")).toBeVisible()
    await expect(page.getByText(submittedText)).toBeVisible()
  })
})
