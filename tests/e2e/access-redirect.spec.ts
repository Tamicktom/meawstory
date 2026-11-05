//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { registerAccount } from "../helpers/register-account"
import { signIn } from "../helpers/sign-in"

const protectedPath = "/dashboard/themes"
const signInWithDestination = "/sign-in?next=%2Fdashboard%2Fthemes"

test.describe("protected routes", () => {
  test("send a visitor to sign in and keep the destination", async ({
    page,
  }) => {
    await page.goto(protectedPath)

    await expect(page).toHaveURL(signInWithDestination)
  })

  test("keep the query string of the destination", async ({ page }) => {
    await page.goto("/dashboard/themes?page=2")

    await expect(page).toHaveURL(
      "/sign-in?next=%2Fdashboard%2Fthemes%3Fpage%3D2"
    )
  })

  test("use the real session when the cookie is stale", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: "stale-token",
        url: "http://localhost:3000",
      },
    ])

    await page.goto(protectedPath)

    await expect(page).toHaveURL(signInWithDestination)
    await expect(page.locator("#sign-in-form")).toBeVisible()
  })
})

test.describe("signing in", () => {
  test("returns to the requested page", async ({ page, request }) => {
    const account = await registerAccount(request)

    await page.goto(protectedPath)
    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha").fill(account.password)
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(page).toHaveURL(protectedPath)
    await expect(
      page.getByRole("heading", { name: "Exercícios" })
    ).toBeVisible()
  })

  test("keeps the destination through sign up", async ({ page }) => {
    await page.goto(protectedPath)
    await page.getByRole("link", { name: "Criar uma conta" }).click()

    await expect(page).toHaveURL("/sign-up?next=%2Fdashboard%2Fthemes")

    await page.getByRole("link", { name: "Já tenho conta" }).click()

    await expect(page).toHaveURL(signInWithDestination)
  })

  for (const unsafe of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/api/auth/sign-out",
    "/dashboard/../api/auth/sign-out",
  ]) {
    test(`ignores the unsafe destination ${unsafe}`, async ({
      page,
      request,
    }) => {
      const account = await registerAccount(request)

      await page.goto(`/sign-in?next=${encodeURIComponent(unsafe)}`)
      await page.getByLabel("E-mail").fill(account.email)
      await page.getByLabel("Senha").fill(account.password)
      await page.getByRole("button", { name: "Entrar" }).click()

      await expect(page).toHaveURL("/dashboard")
    })
  }
})

test.describe("a signed-in person", () => {
  test("goes to the dashboard from sign in and sign up", async ({ page }) => {
    await signIn(page)

    await page.goto("/sign-in")
    await expect(page).toHaveURL("/dashboard")

    await page.goto("/sign-up")
    await expect(page).toHaveURL("/dashboard")
  })

  test("goes to the destination from sign in", async ({ page }) => {
    await signIn(page)

    await page.goto(signInWithDestination)

    await expect(page).toHaveURL(protectedPath)
  })
})
