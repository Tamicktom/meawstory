//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { createSignUpAccount } from "../factories/sign-up-account"

test.describe("sign up page", () => {
  test("shows the create account form", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/sign-up")

    await expect(page.getByText("Crie sua conta")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Criar conta" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Criar conta" })
    ).toBeEnabled()
  })

  test("creates an account with a generated user and opens the dashboard", async ({
    page,
  }) => {
    const account = createSignUpAccount()

    await page.goto("/sign-up")

    await page.getByLabel("Nome").fill(account.name)
    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha", { exact: true }).fill(account.password)
    await page.getByLabel("Confirme a senha").fill(account.confirmPassword)
    await page.getByRole("button", { name: "Criar conta" }).click()

    await expect(page).toHaveURL("/dashboard")
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  })
})
