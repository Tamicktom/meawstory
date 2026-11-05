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
  test("clears cached queries before opening the dashboard", async ({
    page,
    request,
  }) => {
    const account = await registerAccount(request)

    await installQueryCacheProbe(page)
    await page.goto("/sign-in")
    await expect(page.getByText("Entre na sua conta")).toBeVisible()
    await seedPreviousUserQuery(page)

    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha").fill(account.password)
    await page.getByRole("button", { name: "Entrar" }).click()

    await expect(page).toHaveURL("/dashboard")
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
    await expectCachedQueriesCleared(page)
  })
})

test.describe("sign up", () => {
  test("clears cached queries before opening the dashboard", async ({
    page,
  }) => {
    const account = createSignUpAccount()

    await installQueryCacheProbe(page)
    await page.goto("/sign-up")
    await expect(page.getByText("Crie sua conta")).toBeVisible()
    await seedPreviousUserQuery(page)

    await page.getByLabel("Nome").fill(account.name)
    await page.getByLabel("E-mail").fill(account.email)
    await page.getByLabel("Senha", { exact: true }).fill(account.password)
    await page.getByLabel("Confirme a senha").fill(account.confirmPassword)
    await page.getByRole("button", { name: "Criar conta" }).click()

    await expect(page).toHaveURL("/dashboard")
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
    await expectCachedQueriesCleared(page)
  })
})
