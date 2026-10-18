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
    await page.getByLabel("Name").fill(attempt.name)
    await page.getByLabel("Email").fill(attempt.email)
    await page.getByLabel("Password", { exact: true }).fill(attempt.password)
    await page.getByLabel("Confirm password").fill(attempt.confirmPassword)
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(
      page.getByText("User already exists. Use another email.", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Could not create account", { exact: true })
    ).toBeVisible()
    await expect(page).toHaveURL("/sign-up")
    await expect(page.locator("#sign-up-form")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeEnabled()
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toHaveCount(0)
  })
})
