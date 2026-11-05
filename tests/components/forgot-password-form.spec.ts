//* Libraries imports
import { type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"

const story = "components/auth/forgot-password-form/Default"
const endpoint = "**/api/auth/request-password-reset"

async function fulfill(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

test.describe("ForgotPasswordForm", () => {
  test("validates the email before sending anything", async ({
    mount,
    page,
  }) => {
    const requests: string[] = []

    await page.route(endpoint, async (route) => {
      requests.push(route.request().url())
      await route.abort()
    })

    const component = await mount(story)

    await component.getByRole("button", { name: "Enviar link" }).click()

    await expect(component.getByText("Informe um e-mail válido")).toBeVisible()
    expect(requests).toHaveLength(0)
  })

  test("sends the email and the return page, then shows the neutral message", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 200, { status: true })
    })

    const component = await mount(story)
    const request = page.waitForRequest(endpoint)

    await component.getByLabel("E-mail").fill("ada@example.com")
    await component.getByRole("button", { name: "Enviar link" }).click()

    expect((await request).postDataJSON()).toEqual({
      email: "ada@example.com",
      redirectTo: "/reset-password",
    })
    await expect(component.getByText("Confira seu e-mail")).toBeVisible()
    await expect(
      component.getByText("Se houver uma conta com esse e-mail", {
        exact: false,
      })
    ).toBeVisible()
  })

  test("hides server details when the request fails", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 500, { message: "Resend API key is invalid" })
    })

    const component = await mount(story)

    await component.getByLabel("E-mail").fill("ada@example.com")
    await component.getByRole("button", { name: "Enviar link" }).click()

    await expect(component.getByText("Pedido não enviado")).toBeVisible()
    await expect(component.getByText("Resend")).toHaveCount(0)
  })

  test("asks to wait when there were too many requests", async ({
    mount,
    page,
  }) => {
    await page.route(endpoint, async (route) => {
      await fulfill(route, 429, { message: "Too many requests" })
    })

    const component = await mount(story)

    await component.getByLabel("E-mail").fill("ada@example.com")
    await component.getByRole("button", { name: "Enviar link" }).click()

    await expect(component.getByText("Aguarde um minuto")).toBeVisible()
  })
})
