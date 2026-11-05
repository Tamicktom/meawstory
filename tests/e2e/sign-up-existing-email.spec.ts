//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { createSignUpAccount } from "../factories/sign-up-account"
import { registerAccount } from "../helpers/register-account"

test.describe("sign up page", () => {
  test("stays on the form when the email already has an account", async ({
    page,
    request,
  }) => {
    const existing = await registerAccount(request)
    const attempt = createSignUpAccount({ email: existing.email })

    await page.goto("/sign-up")
    await page.getByLabel("Nome").fill(attempt.name)
    await page.getByLabel("E-mail").fill(attempt.email)
    await page.getByLabel("Senha", { exact: true }).fill(attempt.password)
    await page.getByLabel("Confirme a senha").fill(attempt.confirmPassword)
    await page.getByRole("button", { name: "Criar conta" }).click()

    await expect(
      page.getByText(
        "Já existe uma conta com esse e-mail. Entre na sua conta ou recupere a senha.",
        { exact: true }
      )
    ).toBeVisible()
    await expect(
      page.getByText("Não foi possível criar a conta", { exact: true })
    ).toBeVisible()
    await expect(page).toHaveURL("/sign-up")
    await expect(page.locator("#sign-up-form")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Criar conta" })
    ).toBeEnabled()
    await expect(page.getByRole("heading", { name: "Início" })).toHaveCount(0)
  })
})
