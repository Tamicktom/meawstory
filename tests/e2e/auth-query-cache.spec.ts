//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { createSignUpAccount } from "../factories/sign-up-account"
import {
  expectCachedQueriesCleared,
  installQueryCacheProbe,
  seedPreviousUserQuery,
} from "../helpers/query-cache"
import { registerAccount } from "../helpers/register-account"

test.describe("sign in", () => {
  test("clears cached queries before opening the home page", async ({
    page,
    request,
  }) => {
    const account = await registerAccount(request)

    await installQueryCacheProbe(page)
    await page.goto("/sign-in")
    await expect(page.getByText("Sign in to your account")).toBeVisible()
    await seedPreviousUserQuery(page)

    await page.getByLabel("Email").fill(account.email)
    await page.getByLabel("Password").fill(account.password)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("/")
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
    await expectCachedQueriesCleared(page)
  })
})

test.describe("sign up", () => {
  test("clears cached queries before opening the home page", async ({
    page,
  }) => {
    const account = createSignUpAccount()

    await installQueryCacheProbe(page)
    await page.goto("/sign-up")
    await expect(page.getByText("Create your account")).toBeVisible()
    await seedPreviousUserQuery(page)

    await page.getByLabel("Name").fill(account.name)
    await page.getByLabel("Email").fill(account.email)
    await page.getByLabel("Password", { exact: true }).fill(account.password)
    await page.getByLabel("Confirm password").fill(account.confirmPassword)
    await page.getByRole("button", { name: "Create account" }).click()

    await expect(page).toHaveURL("/")
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
    await expectCachedQueriesCleared(page)
  })
})
