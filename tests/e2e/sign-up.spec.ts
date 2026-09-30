//* Libraries imports
import { expect, test } from "@playwright/test"

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
})
