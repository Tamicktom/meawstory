//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { createSignUpAccount } from "../factories/sign-up-account"
import { signIn } from "../helpers/sign-in"

test.describe("sign in page", () => {
  test("shows the sign in form", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/sign-in")

    await expect(page.getByText("Sign in to your account")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Sign in" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled()
    await expect(
      page.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", "/sign-up")
  })

  test("signs in with an existing account and opens the home page", async ({
    page,
    request,
  }) => {
    const account = createSignUpAccount()
    const response = await request.post("/api/auth/sign-up/email", {
      headers: {
        Origin: "http://localhost:3000",
      },
      data: {
        name: account.name,
        email: account.email,
        password: account.password,
      },
    })

    expect(response.ok()).toBeTruthy()

    await page.goto("/sign-in")
    await page.getByLabel("Email").fill(account.email)
    await page.getByLabel("Password").fill(account.password)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("/")
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
  })
})

test.describe("signIn helper", () => {
  test("authenticates the browser through the sign in API", async ({
    page,
  }) => {
    const account = await signIn(page)
    const session = await page.request.get("/api/auth/get-session")

    expect(session.ok()).toBeTruthy()

    const body = await session.json()

    expect(body).toMatchObject({
      user: {
        email: account.email,
        name: account.name,
      },
    })

    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
  })
})
