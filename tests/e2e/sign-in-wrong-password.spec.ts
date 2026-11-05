//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { registerAccount } from "../helpers/register-account"

test.describe("sign in page", () => {
  test("stays on the form when the password is wrong", async ({
    page,
    request,
  }) => {
    const account = await registerAccount(request)

    await page.goto("/sign-in")
    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha").fill("wrong-password")
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(
      page.getByText("E-mail ou senha incorretos.", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Não foi possível entrar", { exact: true })
    ).toBeVisible()
    await expect(page).toHaveURL("/sign-in")
    await expect(page.locator("#sign-in-form")).toBeVisible()
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled()
    await expect(page.getByRole("heading", { name: "Início" })).toHaveCount(0)
  })
})
