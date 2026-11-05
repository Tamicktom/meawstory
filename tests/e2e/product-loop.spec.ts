//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { savedCorrection } from "../helpers/saved-correction"
import { confirmEmail } from "../helpers/email-outbox"
import { signIn } from "../helpers/sign-in"

const themeTitle = "A chave na mesa"
const themeId = "theme_key_on_the_table"
const submittedText = "A chave ficou na mesa entre as duas. ".repeat(15).trim()

for (const width of [1280, 320, 390]) {
  test.describe(`product loop at ${width}px`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: width < 768,
      hasTouch: width < 768,
    })
    test("walks from the theme list to the saved correction", async ({
      page,
    }) => {
      test.setTimeout(60_000)

      const account = await signIn(page)

      await confirmEmail(page, account.email)
      if (width < 768) {
        await page.goto("/dashboard")
        await page.getByRole("button", { name: "Alternar menu" }).tap()
        const menu = page.getByRole("dialog", { name: "Menu de navegação" })
        await expect(menu).toBeVisible()
        await menu.getByRole("link", { name: "Exercícios" }).tap()
        await expect(menu).not.toBeVisible()
      } else {
        await page.goto("/dashboard/themes")
      }
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")

      await page.getByRole("link", { name: themeTitle }).click()

      await expect(page).toHaveURL(`/dashboard/themes/${themeId}`)
      await expect(
        page.getByRole("heading", { name: themeTitle })
      ).toBeVisible()
      await expect(page.getByText(/Theme Page|Theme ID/)).toHaveCount(0)

      await page.getByRole("link", { name: "Começar a escrever" }).click()

      await expect(page).toHaveURL(`/dashboard/exercises/${themeId}/write`)

      const editor = page.locator("#scene-content")

      await expect(editor).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      if (width < 768) {
        const editorBox = await editor.boundingBox()
        const informationBox = await page
          .getByRole("complementary")
          .boundingBox()
        expect(editorBox!.y).toBeLessThan(informationBox!.y)
      }
      await editor.click()
      await page.keyboard.press("ControlOrMeta+A")
      await page.keyboard.insertText(submittedText)
      await page.getByRole("button", { name: "Enviar para leitura" }).click()

      await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
        timeout: 45_000,
      })
      await expect(
        page.getByRole("heading", { name: themeTitle })
      ).toBeVisible()
      await expect(page.getByText(savedCorrection.content)).toBeVisible()
      await expect(page.getByText("Pontuação: 640 de 1000")).toBeVisible()
      await expect(page.getByText(submittedText)).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await page.getByRole("link", { name: "Voltar para Minhas cenas" }).click()
      await expect(
        page.getByRole("heading", { name: "Minhas cenas" })
      ).toBeVisible()
      await expect(
        page.getByRole("link", { name: new RegExp(themeTitle) })
      ).toContainText("Pontuação: 640 de 1000")
    })
  })
}
