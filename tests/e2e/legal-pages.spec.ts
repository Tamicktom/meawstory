import { expect, test } from "@playwright/test"

for (const width of [320, 390, 1280]) {
  test.describe(`legal documents at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })

    test("opens public documents from the landing without an account", async ({
      page,
    }) => {
      await page.goto("/")

      for (const [name, path] of [
        ["Termos de uso", "/termos"],
        ["Política de privacidade", "/privacidade"],
      ]) {
        const opened = page.waitForEvent("popup")
        await page.getByRole("link", { name: new RegExp(name) }).click()
        const legalPage = await opened
        await expect(legalPage).toHaveURL(path)
        await expect(legalPage).toHaveTitle(`${name} | Meawstory`)
        await expect(
          legalPage.getByRole("heading", { level: 1, name })
        ).toBeVisible()
        await expect(legalPage.locator("html")).toHaveAttribute("lang", "pt-BR")
        expect(
          await legalPage.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width)
        await legalPage.close()
      }

      await page.goto("/termos")
      await page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Política de privacidade" })
        .click()
      await expect(page).toHaveURL("/privacidade")
      await expect(
        page.getByRole("heading", { name: "Para onde vai sua cena" })
      ).toBeVisible()
      await page.getByRole("link", { name: "Voltar ao início" }).click()
      await expect(page).toHaveURL("/")
    })

    test("lets a person read the terms without losing sign-up fields or the destination", async ({
      page,
    }) => {
      const destination = "/dashboard/exercises/theme_key_on_the_table/write"
      await page.goto(`/sign-up?next=${encodeURIComponent(destination)}`)
      await page.getByLabel("Nome", { exact: true }).fill("Pessoa convidada")
      await page
        .getByLabel("E-mail", { exact: true })
        .fill("pessoa@example.com")
      await expect(
        page.getByText("Ao criar sua conta, você declara ter 18 anos ou mais", {
          exact: false,
        })
      ).toBeVisible()

      for (const name of ["Termos de uso", "Política de privacidade"]) {
        const opened = page.waitForEvent("popup")
        await page.getByRole("link", { name: new RegExp(name) }).click()
        const legalPage = await opened
        await expect(
          legalPage.getByRole("heading", { level: 1, name })
        ).toBeVisible()
        await legalPage.close()
      }

      await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(
        "Pessoa convidada"
      )
      await expect(page.getByLabel("E-mail", { exact: true })).toHaveValue(
        "pessoa@example.com"
      )
      await expect(
        page.getByRole("link", { name: "Já tenho conta" })
      ).toHaveAttribute(
        "href",
        `/sign-in?next=${encodeURIComponent(destination)}`
      )
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
    })
  })
}
