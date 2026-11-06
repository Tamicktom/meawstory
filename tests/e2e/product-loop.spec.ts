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
        const exercises = page.locator("#mobile-themes")
        await expect(exercises).toBeVisible()
        await exercises.tap()
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
      await expect(
        page.getByRole("heading", { name: "O que será observado" })
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "O que não será penalizado" })
      ).toBeVisible()
      await expect(
        page.getByText(
          "Treinar uma virada de relação sustentada por uma escolha visível."
        )
      ).toBeVisible()
      await expect(
        page.getByText(/Como dar a nota|O que escrever na correção|gpt-5-mini/)
      ).toHaveCount(0)

      await page.getByRole("link", { name: "Começar a escrever" }).click()

      await expect(page).toHaveURL(`/dashboard/exercises/${themeId}/write`)

      const editor = page.locator("#scene-content")

      await expect(editor).toBeVisible()
      await expect(page.locator("#scene-limits")).toContainText(
        "Sugestão do exercício: 400 a 900 palavras"
      )
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
      await expect(
        page.getByText("sua cena é enviada à OpenAI", { exact: false })
      ).toBeVisible()
      const opened = page.waitForEvent("popup")
      await page.getByRole("link", { name: /Política de privacidade/ }).click()
      const privacy = await opened
      await expect(
        privacy.getByRole("heading", {
          level: 1,
          name: "Política de privacidade",
        })
      ).toBeVisible()
      await privacy.close()
      await expect(editor).toHaveValue(submittedText)
      await expect(page.getByRole("status")).toContainText("Salvo há instantes", {
        timeout: 15_000,
      })
      const firstItem = page.getByRole("checkbox").first()
      await firstItem.check()
      await expect(page.getByRole("status")).toContainText("Salvo há instantes")
      await page.reload()
      await expect(page.locator("#scene-content")).toHaveValue(submittedText)
      await expect(page.getByRole("checkbox").first()).toBeChecked()
      await page.getByRole("button", { name: "Enviar para leitura" }).click()
      await page
        .getByRole("button", { name: "Confirmar envio", exact: true })
        .click()

      await expect(page).toHaveURL(/\/dashboard\/texts\/[^/]+$/, {
        timeout: 45_000,
      })
      await expect(
        page.getByRole("heading", { name: themeTitle })
      ).toBeVisible()
      await expect(page.getByText(savedCorrection.opening)).toBeVisible({
        timeout: 45_000,
      })
      await expect(
        page.getByText("Pontuação: 640 de 1000", { exact: true })
      ).not.toBeVisible()
      await page.getByText("Ver pontuação total", { exact: true }).click()
      await expect(
        page.getByText("Pontuação: 640 de 1000", { exact: true })
      ).toBeVisible()
      const criterion = page.getByRole("article").first()
      await criterion
        .getByRole("button", { name: /Ver trecho 1 na cena/ })
        .click()
      const scene = page.getByRole("region", { name: "Sua cena", exact: true })
      await expect(scene).toBeVisible()
      await expect(scene.locator(".whitespace-pre-wrap")).toHaveText(
        submittedText
      )
      await expect(scene.locator("mark:focus")).toBeVisible()
      if (width < 768)
        await scene.getByRole("button", { name: "Voltar à leitura" }).click()
      const utility = page.getByRole("region", { name: "Utilidade da leitura" })
      await utility.getByRole("button", { name: "Sim", exact: true }).click()
      await expect(utility.getByRole("status")).toContainText("Resposta salva")
      await utility.getByRole("button", { name: "Em parte" }).click()
      await expect(
        utility.getByRole("button", { name: "Em parte" })
      ).toHaveAttribute("aria-pressed", "true")
      await criterion
        .getByText("Discordo deste critério", { exact: true })
        .click()
      await criterion
        .getByRole("textbox")
        .fill("Quero investigar esse comentário.")
      await criterion
        .getByRole("button", { name: "Registrar discordância" })
        .click()
      await expect(criterion.getByRole("status")).toContainText(
        "Discordância registrada"
      )
      await page.reload()
      await expect(
        utility.getByRole("button", { name: "Em parte" })
      ).toHaveAttribute("aria-pressed", "true")
      await criterion
        .getByText("Discordo deste critério — registrada", { exact: true })
        .click()
      await expect(criterion.getByRole("textbox")).toHaveValue(
        "Quero investigar esse comentário."
      )
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
