//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { signIn } from "../helpers/sign-in"

const themeTitle = "A chave na mesa"
const themeId = "theme_key_on_the_table"
const draft = "A chave ficou na mesa entre as duas."

for (const width of [1280, 320]) {
  test.describe(`scene deletion at ${width}px`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: width < 768,
      hasTouch: width < 768,
    })

    test("retires a scene from the list and from the scene, then restores it", async ({
      page,
    }) => {
      test.setTimeout(width === 1280 ? 90_000 : 60_000)
      await signIn(page)
      await page.goto(`/dashboard/exercises/${themeId}/write`)
      const editor = page.locator("#scene-content")
      await editor.click()
      await page.keyboard.insertText(draft)
      await expect(page.getByRole("status")).toContainText("Salvo há instantes", {
        timeout: 15_000,
      })

      await page.goto("/dashboard/texts")
      await expect(
        page.getByRole("link", { name: new RegExp(themeTitle) })
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)

      await page.getByRole("button", { name: "Excluir cena" }).click()
      await expect(page.getByRole("status")).toContainText("Cena excluída.")
      await expect(
        page.getByRole("link", { name: new RegExp(themeTitle) })
      ).toHaveCount(0)
      await page.getByRole("button", { name: "Desfazer" }).click()
      await expect(
        page.getByRole("link", { name: new RegExp(themeTitle) })
      ).toBeVisible()

      await page.getByRole("link", { name: new RegExp(themeTitle) }).click()
      await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/)
      await expect(page.getByRole("heading", { name: themeTitle })).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await page.getByRole("button", { name: "Excluir cena" }).click()
      await expect(page).toHaveURL("/dashboard/texts")
      await expect(page.getByRole("status")).toContainText("Cena excluída.")
      await page.getByRole("button", { name: "Desfazer" }).click()
      await expect(
        page.getByRole("link", { name: new RegExp(themeTitle) })
      ).toBeVisible()

      if (width !== 1280) return

      await page.getByRole("button", { name: "Excluir cena" }).click()
      await expect(page.getByRole("status")).toContainText("Cena excluída.")
      await page.waitForTimeout(9_000)
      await page.reload()
      await expect(page.getByText("Você ainda não tem cenas.")).toBeVisible()
      await expect(page.getByRole("button", { name: "Desfazer" })).toHaveCount(0)
      await page.goto(`/dashboard/themes/${themeId}`)
      await expect(
        page.getByRole("link", { name: "Começar a escrever" })
      ).toBeVisible()
      await expect(
        page.getByRole("link", { name: "Continuar rascunho" })
      ).toHaveCount(0)
    })
  })
}
