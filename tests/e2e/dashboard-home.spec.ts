import { expect, test } from "@playwright/test"
import { signIn } from "../helpers/sign-in"

for (const width of [320, 390, 1280]) {
  test(`first entry, persistence and draft continuation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await signIn(page)
    await page.goto("/dashboard")
    await expect(
      page.getByRole("heading", { name: "O que você quer treinar agora?" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Cenas recentes" })
    ).toHaveCount(0)
    await page.getByRole("button", { name: "Romance", exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard\/themes\//)
    await expect(
      page.getByText("Romance", { exact: true }).first()
    ).toBeVisible()
    await page.getByRole("link", { name: "Começar a escrever" }).click()
    await page
      .locator("#scene-content")
      .fill("A chave ficou na mesa entre as duas.")
    await expect(page.getByRole("status")).toContainText("Salvo há instantes", {
      timeout: 15000,
    })
    await page.goto("/dashboard")
    await expect(
      page.getByRole("heading", { name: "O que você quer treinar agora?" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "Cenas recentes" })
    ).toBeVisible()
    await expect(page.getByText(/8 palavras/)).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width)
    await page.locator("#dashboard-next-action").click()
    await expect(page.locator("#scene-content")).toHaveValue(
      "A chave ficou na mesa entre as duas."
    )
  })
}

test("skip persists across reloads", async ({ page }) => {
  await signIn(page)
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Pular por enquanto" }).click()
  await expect(page).toHaveURL("/dashboard/themes")
  await page.goto("/dashboard")
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "O que você quer treinar agora?" })
  ).toHaveCount(0)
  await expect(page.locator("#dashboard-next-action")).toHaveText(
    "Escolher um exercício"
  )
})
