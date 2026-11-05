//* Libraries imports
import { type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"

const story = "components/auth/reset-password-form/Default"
const endpoint = "**/api/auth/reset-password"
const password = "Nova!Senha123"

async function fulfill(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

test.describe("ResetPasswordForm", () => {
  test("validates the length and the confirmation", async ({ mount, page }) => {
    const requests: string[] = []

    await page.route(endpoint, async (route) => {
      requests.push(route.request().url())
      await route.abort()
    })

    const component = await mount(story)
    const submit = component.getByRole("button", { name: "Salvar nova senha" })

    await component.getByLabel("Nova senha", { exact: true }).fill("curta")
    await submit.click()
    await expect(
      component.getByText("A senha precisa ter pelo menos 8 caracteres")
    ).toBeVisible()

    await component.getByLabel("Nova senha", { exact: true }).fill(password)
    await component.getByLabel("Confirme a nova senha").fill("outra-senha")
    await submit.click()
    await expect(component.getByText("As senhas não são iguais")).toBeVisible()

    expect(requests).toHaveLength(0)
  })

  test("sends the token with the new password and shows the next step", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 200, { status: true })
    })

    const component = await mount(story)
    const request = page.waitForRequest(endpoint)

    await component.getByLabel("Nova senha", { exact: true }).fill(password)
    await component.getByLabel("Confirme a nova senha").fill(password)
    await component.getByRole("button", { name: "Salvar nova senha" }).click()

    expect((await request).postDataJSON()).toEqual({
      newPassword: password,
      token: "token-1",
    })
    await expect(component.getByText("Senha redefinida")).toBeVisible()
    await expect(component.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/sign-in"
    )
  })

  test("shows the invalid link state when the server refuses the token", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 400, { code: "INVALID_TOKEN", message: "Invalid token" })
    })

    const component = await mount(story)

    await component.getByLabel("Nova senha", { exact: true }).fill(password)
    await component.getByLabel("Confirme a nova senha").fill(password)
    await component.getByRole("button", { name: "Salvar nova senha" }).click()

    await expect(component.getByText("Este link não vale mais")).toBeVisible()
    await expect(
      component.getByRole("link", { name: "Pedir um novo link" })
    ).toHaveAttribute("href", "/forgot-password")
  })

  test("keeps the form and hides server details on another failure", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 500, { message: "Database is down" })
    })

    const component = await mount(story)

    await component.getByLabel("Nova senha", { exact: true }).fill(password)
    await component.getByLabel("Confirme a nova senha").fill(password)
    await component.getByRole("button", { name: "Salvar nova senha" }).click()

    await expect(component.getByText("Senha não redefinida")).toBeVisible()
    await expect(component.getByText("Database")).toHaveCount(0)
    await expect(
      component.getByRole("button", { name: "Salvar nova senha" })
    ).toBeEnabled()
  })
})
