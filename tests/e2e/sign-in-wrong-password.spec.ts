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
    await page.getByLabel("Email").fill(account.email)
    await page.getByLabel("Password").fill("wrong-password")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(
      page.getByText("Invalid email or password", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Could not sign in", { exact: true })
    ).toBeVisible()
    await expect(page).toHaveURL("/sign-in")
    await expect(page.locator("#sign-in-form")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled()
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toHaveCount(0)
  })
})
