//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { savedCorrection } from "../helpers/saved-correction"
import { confirmEmail } from "../helpers/email-outbox"
import { signIn } from "../helpers/sign-in"

const themeTitle = "A chave na mesa"
const themeId = "theme_key_on_the_table"
const submittedText = "A chave ficou na mesa entre as duas. ".repeat(15).trim()
const revisedText = `${submittedText}\n\nEla estendeu a mão e parou.`
const intention = "Quis mostrar o gesto antes da decisão."

for (const width of [1280, 320]) {
  test.describe(`revision at ${width}px`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: width < 768,
      hasTouch: width < 768,
    })

    test("keeps the previous version and stores the intention on the next one", async ({
      page,
    }) => {
      test.setTimeout(90_000)
      const account = await signIn(page)
      await confirmEmail(page, account.email)
      await page.goto(`/dashboard/exercises/${themeId}/write`)
      await page.locator("#scene-content").fill(submittedText)
      await page.getByRole("button", { name: "Enviar para leitura" }).click()
      await page
        .getByRole("button", { name: "Confirmar envio", exact: true })
        .click()
      await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
        timeout: 45_000,
      })
      await expect(page.getByText(savedCorrection.opening)).toBeVisible({
        timeout: 45_000,
      })
      await page
        .getByRole("link", { name: "Revisar com esse foco", exact: true })
        .click()
      await expect(page).toHaveURL(/\/write\?textId=/)
      await expect(page.getByText("Versão 2 · rascunho")).toBeVisible()
      await expect(page.getByText(savedCorrection.revision)).toBeVisible()
      await expect(page.locator("#scene-content")).toHaveValue(submittedText)
      await page.locator("#scene-content").fill(revisedText)
      await page.locator("#revision-intent").fill(intention)
      await page.getByRole("button", { name: "Enviar para leitura" }).click()
      await expect(
        page.getByRole("region", { name: "Conferir envio" })
      ).toContainText(intention)
      await page
        .getByRole("button", { name: "Confirmar envio", exact: true })
        .click()
      await expect(page).toHaveURL(/\/dashboard\/texts\/[^/?]+$/, {
        timeout: 45_000,
      })
      await expect(page.getByText("Leitura · Versão 2")).toBeVisible({
        timeout: 45_000,
      })
      await expect(
        page.getByRole("region", { name: "Contexto da revisão" })
      ).toContainText(intention)
      const sceneUrl = page.url()
      await page.goto(`${sceneUrl}?versao=1`)
      await expect(page.getByText("Leitura · Versão 1")).toBeVisible()
      await expect(
        page.getByRole("region", { name: "Contexto da revisão" })
      ).toHaveCount(0)
      await expect(
        page.getByRole("link", { name: "Revisar com esse foco", exact: true })
      ).toHaveCount(0)
      const earlierScene = page.getByRole("region", {
        name: "Sua cena",
        exact: true,
      })
      if (width < 768)
        await page.getByRole("tab", { name: "Cena", exact: true }).click()
      await expect(earlierScene).toContainText(submittedText)
      await expect(earlierScene).not.toContainText("Ela estendeu a mão")
      if (width < 768)
        await page.getByRole("tab", { name: "Leitura", exact: true }).click()
      await page
        .getByRole("link", { name: "Abrir a versão mais recente" })
        .click()
      const latestScene = page.getByRole("region", {
        name: "Sua cena",
        exact: true,
      })
      if (width < 768)
        await page.getByRole("tab", { name: "Cena", exact: true }).click()
      await expect(latestScene).toContainText("Ela estendeu a mão e parou.")
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
    })
  })
}
