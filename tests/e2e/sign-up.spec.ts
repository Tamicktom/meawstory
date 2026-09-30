//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { createSignUpAccount } from "../factories/sign-up-account"

test.describe("sign up page", () => {
  test("shows the create account form", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/sign-up")

    await expect(page.getByText("Create your account")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeEnabled()
  })

  test("creates an account with a generated user and opens the home page", async ({
    page,
  }) => {
    const account = createSignUpAccount()

    await page.goto("/sign-up")

    await page.getByLabel("Name").fill(account.name)
    await page.getByLabel("Email").fill(account.email)
    await page.getByLabel("Password", { exact: true }).fill(account.password)
    await page.getByLabel("Confirm password").fill(account.confirmPassword)
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(page).toHaveURL("/")
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
  })
})
