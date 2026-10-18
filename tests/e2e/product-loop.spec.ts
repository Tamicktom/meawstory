//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import {
  removeSavedCorrection,
  savedCorrection,
  writeSavedCorrection,
} from "../helpers/saved-correction"
import { signIn } from "../helpers/sign-in"

const themeTitle = "A chave na mesa"
const themeId = "theme_key_on_the_table"
const submittedText = "A chave ficou na mesa entre as duas."

test.describe("product loop", () => {
  test.beforeEach(async () => {
    await writeSavedCorrection()
  })

  test.afterEach(async () => {
    await removeSavedCorrection()
  })

  test("walks from the theme list to the saved correction", async ({
    page,
  }) => {
    test.setTimeout(60_000)

    await signIn(page)
    await page.goto("/dashboard/themes")

    await page.getByRole("link", { name: themeTitle }).click()

    await expect(page).toHaveURL(`/dashboard/themes/${themeId}`)

    await page.getByRole("link", { name: "Escrever exercício" }).click()

    await expect(page).toHaveURL(`/dashboard/exercises/${themeId}/write`)

    const editor = page.locator(".ProseMirror")

    await expect(editor).toBeVisible()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+A")
    await page.keyboard.insertText(submittedText)
    await page.getByRole("button", { name: "Enviar texto" }).click()

    await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
      timeout: 45_000,
    })
    await expect(page.getByRole("heading", { name: themeTitle })).toBeVisible()
    await expect(page.getByText(savedCorrection.content)).toBeVisible()
    await expect(page.getByText("Nota 640 de 1000")).toBeVisible()
    await expect(page.getByText(submittedText)).toBeVisible()
  })
})
