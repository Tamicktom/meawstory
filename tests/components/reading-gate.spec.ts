//* Libraries imports
import { type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"

const scene = "A chave ficou na mesa entre as duas."
const blockedCopy =
  "Confirme seu e-mail para receber a leitura. Sua cena está salva."
const resendEndpoint = "**/api/auth/send-verification-email"
const startEndpoint = "**/api/correction/start/text-1"
const statusEndpoint = "**/api/correction/check-correction-status/text-1"

async function fulfill(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

test.describe("ReadingGate", () => {
  test.describe("when the email is not confirmed", () => {
    test("shows the message and the scene, and offers no reading", async ({
      mount,
    }) => {
      const component = await mount("components/reading/reading-gate/Unverified")

      await expect(component.getByText(blockedCopy)).toBeVisible()
      await expect(component.getByText(scene)).toBeVisible()
      await expect(
        component.getByRole("button", { name: "Receber a leitura" })
      ).toHaveCount(0)
    })

    test("asks for another email that returns to this scene", async ({
      mount,
      page,
    }) => {
      await page.route(resendEndpoint, async (route) => {
        await fulfill(route, 200, { status: true })
      })

      const component = await mount("components/reading/reading-gate/Unverified")
      const request = page.waitForRequest(resendEndpoint)

      await component.getByRole("button", { name: "Reenviar e-mail" }).click()

      expect((await request).postDataJSON()).toEqual({
        email: "ada@example.com",
        callbackURL: "/dashboard/texts/text-1",
      })
      await expect(component.getByRole("status")).toContainText(
        "ada@example.com"
      )
    })

    test("refreshes when the email was confirmed in another tab", async ({
      mount,
      page,
    }) => {
      await page.route(resendEndpoint, async (route) => {
        await fulfill(route, 400, { code: "EMAIL_ALREADY_VERIFIED" })
      })

      const component = await mount("components/reading/reading-gate/Unverified")

      await component.getByRole("button", { name: "Reenviar e-mail" }).click()

      await expect(page.locator("html")).toHaveAttribute(
        "data-refreshed",
        "true"
      )
    })

    test("hides server details when the request fails", async ({
      mount,
      page,
    }) => {
      await page.route(resendEndpoint, async (route) => {
        await fulfill(route, 500, { message: "Resend API key is invalid" })
      })

      const component = await mount("components/reading/reading-gate/Unverified")

      await component.getByRole("button", { name: "Reenviar e-mail" }).click()

      await expect(component.getByRole("alert")).toContainText(
        "Não foi possível"
      )
      await expect(component.getByText("Resend")).toHaveCount(0)
    })

    test("explains an expired link", async ({ mount }) => {
      const component = await mount(
        "components/reading/reading-gate/ExpiredLink"
      )

      await expect(
        component.getByText("expirou ou não é mais válido")
      ).toBeVisible()
    })
  })

  test.describe("when the email is confirmed", () => {
    test("starts the reading and refreshes when it is ready", async ({
      mount,
      page,
    }) => {
      await page.route(startEndpoint, async (route) => {
        await fulfill(route, 200, { textId: "text-1" })
      })
      await page.route(statusEndpoint, async (route) => {
        await fulfill(route, 200, { status: "COMPLETED" })
      })

      const component = await mount("components/reading/reading-gate/Verified")

      await expect(component.getByText(scene)).toBeVisible()
      await component.getByRole("button", { name: "Receber a leitura" }).click()

      await expect(page.locator("html")).toHaveAttribute(
        "data-refreshed",
        "true"
      )
    })

    test("offers the action again when the start fails", async ({
      mount,
      page,
    }) => {
      await page.route(startEndpoint, async (route) => {
        await fulfill(route, 500, {})
      })

      const component = await mount("components/reading/reading-gate/Verified")

      await component.getByRole("button", { name: "Receber a leitura" }).click()

      await expect(component.getByRole("alert")).toContainText(
        "Sua cena continua salva"
      )
      await expect(
        component.getByRole("button", { name: "Receber a leitura" })
      ).toBeEnabled()
    })

    test("opens the reading state after dispatch", async ({
      mount,
      page,
    }) => {
      await page.route(startEndpoint, async (route) => {
        await fulfill(route, 200, { textId: "text-1" })
      })
      await page.route(statusEndpoint, async (route) => {
        await fulfill(route, 200, { status: "FAILED" })
      })

      const component = await mount("components/reading/reading-gate/Verified")

      await component.getByRole("button", { name: "Receber a leitura" }).click()

      await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
    })

    test("refreshes when a reading already exists", async ({ mount, page }) => {
      await page.route(startEndpoint, async (route) => {
        await fulfill(route, 409, { message: "A leitura já foi iniciada. Abra a cena em Minhas cenas." })
      })

      const component = await mount("components/reading/reading-gate/Verified")

      await component.getByRole("button", { name: "Receber a leitura" }).click()

      await expect(page.locator("html")).toHaveAttribute(
        "data-refreshed",
        "true"
      )
      await expect(component.getByRole("alert")).toHaveCount(0)
    })
  })
})
