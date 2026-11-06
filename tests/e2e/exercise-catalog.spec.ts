import { expect, test } from "@playwright/test"
import { signIn } from "../helpers/sign-in"

for (const width of [320, 390, 1280]) {
  test.describe(`exercise catalog at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })
    test("combines filters, continues a saved draft and clears empty results", async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await signIn(page)
      await page.goto("/dashboard/themes")
      const cards = page
        .getByRole("listitem")
        .filter({ has: page.getByRole("link", { name: /Abrir exercício/ }) })
      await expect(cards).toHaveCount(12)
      const target = cards.filter({ hasText: "A chave na mesa" })
      await expect(target).toContainText("Não escrito")
      await expect(target).toContainText("palavras")
      await page.getByLabel("Gênero", { exact: true }).selectOption("action")
      await page
        .getByLabel("Situação", { exact: true })
        .selectOption("unwritten")
      await page.getByRole("button", { name: "Filtrar", exact: true }).click()
      await expect(
        page
          .getByRole("listitem")
          .filter({ has: page.getByRole("link", { name: /Abrir exercício/ }) })
      ).toHaveCount(2)
      await page.getByRole("link", { name: "Limpar filtros" }).click()
      await target.getByRole("link").click()
      await expect(page).toHaveURL(
        /\/dashboard\/themes\/theme_key_on_the_table$/
      )
      await page.getByRole("link", { name: "Começar a escrever" }).click()
      await page.locator("#scene-content").click()
      await page.keyboard.insertText("A chave ficou na mesa entre as duas.")
      await expect(page.getByRole("status")).toContainText(
        "Salvo há instantes",
        { timeout: 15_000 }
      )
      await page.goto("/dashboard/themes")
      const draftCard = page
        .getByRole("listitem")
        .filter({ hasText: "A chave na mesa" })
      await expect(draftCard).toContainText("Rascunho")
      await page.getByLabel("Situação", { exact: true }).selectOption("draft")
      await page.getByRole("button", { name: "Filtrar", exact: true }).click()
      await expect(
        page.getByRole("link", { name: /Continuar rascunho/ })
      ).toHaveCount(1)
      await page.reload()
      await draftCard.getByRole("link", { name: /Continuar rascunho/ }).click()
      await expect(page.locator("#scene-content")).toHaveValue(
        "A chave ficou na mesa entre as duas."
      )
      await page.goto("/dashboard/themes?genero=action&situacao=draft")
      await expect(
        page.getByText("Nenhum exercício corresponde a esses filtros.")
      ).toBeVisible()
      await page.getByRole("link", { name: "Remover filtros" }).click()
      await expect(
        page.getByRole("link", { name: /Continuar rascunho/ })
      ).toHaveCount(1)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
    })
  })
}
