//* Libraries imports
import { type Locator, type Page, type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"

const story = "components/auth/sign-in-form/Default"
const signInEndpoint = "**/api/auth/sign-in/email"

type Credentials = {
  email: string
  password: string
}

function validCredentials(overrides: Partial<Credentials> = {}): Credentials {
  return {
    email: "ada@example.com",
    password: "password123",
    ...overrides,
  }
}

async function fillCredentials(component: Locator, credentials: Credentials) {
  await component.getByLabel("Email").fill(credentials.email)
  await component.getByLabel("Password").fill(credentials.password)
}

async function submit(component: Locator) {
  await component.getByRole("button", { name: "Sign in" }).click()
}

async function captureSignInRequests(page: Page) {
  const requests: string[] = []

  await page.route(signInEndpoint, async (route) => {
    requests.push(route.request().url())
    await route.abort()
  })

  return requests
}

async function fulfillSignIn(
  route: Route,
  response: { status: number; body: Record<string, unknown> }
) {
  await route.fulfill({
    status: response.status,
    contentType: "application/json",
    body: JSON.stringify(response.body),
  })
}

test.describe("SignInForm", () => {
  test.describe("rendering", () => {
    test("shows the sign in fields and an enabled submit button", async ({
      mount,
    }) => {
      const component = await mount(story)

      await expect(
        component.getByText("Sign in to your account")
      ).toBeVisible()
      await expect(
        component.getByText("Use your email and password to continue.")
      ).toBeVisible()
      await expect(component.getByLabel("Email")).toBeVisible()
      await expect(component.getByLabel("Password")).toBeVisible()
      await expect(
        component.getByRole("button", { name: "Sign in" })
      ).toBeEnabled()
      await expect(
        component.getByRole("link", { name: "Create an account" })
      ).toHaveAttribute("href", "/sign-up")
    })
  })

  test.describe("validation", () => {
    test("shows field errors when the form is submitted empty", async ({
      mount,
      page,
    }) => {
      const requests = await captureSignInRequests(page)
      const component = await mount(story)

      await submit(component)

      await expect(
        component.getByText("Enter a valid email address")
      ).toBeVisible()
      await expect(
        component.getByText("Password must be at least 8 characters")
      ).toBeVisible()
      await expect(component.getByLabel("Email")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      await expect(component.getByLabel("Password")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      expect(requests).toHaveLength(0)
    })

    test("shows an error when the email is invalid", async ({
      mount,
      page,
    }) => {
      const requests = await captureSignInRequests(page)
      const component = await mount(story)

      await fillCredentials(component, validCredentials({ email: "ada@" }))
      await submit(component)

      await expect(
        component.getByText("Enter a valid email address")
      ).toBeVisible()
      await expect(component.getByLabel("Email")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      await expect(component.getByLabel("Password")).not.toHaveAttribute(
        "aria-invalid"
      )
      expect(requests).toHaveLength(0)
    })

    test("shows an error when the password is shorter than 8 characters", async ({
      mount,
      page,
    }) => {
      const requests = await captureSignInRequests(page)
      const component = await mount(story)

      await fillCredentials(component, validCredentials({ password: "short" }))
      await submit(component)

      await expect(
        component.getByText("Password must be at least 8 characters")
      ).toBeVisible()
      await expect(component.getByLabel("Password")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      await expect(component.getByLabel("Email")).not.toHaveAttribute(
        "aria-invalid"
      )
      expect(requests).toHaveLength(0)
    })

    test("shows an error when the password is longer than 128 characters", async ({
      mount,
      page,
    }) => {
      const requests = await captureSignInRequests(page)
      const component = await mount(story)

      await fillCredentials(
        component,
        validCredentials({ password: "a".repeat(129) })
      )
      await submit(component)

      await expect(
        component.getByText("Password must be at most 128 characters")
      ).toBeVisible()
      await expect(component.getByLabel("Password")).toHaveAttribute(
        "aria-invalid",
        "true"
      )
      expect(requests).toHaveLength(0)
    })
  })

  test.describe("submission", () => {
    test("disables the form while signing in", async ({ mount, page }) => {
      let continueRequest = () => {}
      const requestGate = new Promise<void>((resolve) => {
        continueRequest = resolve
      })

      await page.route(signInEndpoint, async (route) => {
        await requestGate
        await fulfillSignIn(route, {
          status: 200,
          body: { token: "token", user: { id: "user-1" } },
        })
      })

      const component = await mount(story)
      const response = page.waitForResponse(signInEndpoint)

      await fillCredentials(component, validCredentials())
      await submit(component)

      const submitButton = component.getByRole("button", {
        name: /Signing in\.\.\./,
      })

      await expect(submitButton).toBeDisabled()
      await expect(component.getByLabel("Email")).toBeDisabled()
      await expect(component.getByLabel("Password")).toBeDisabled()

      continueRequest()
      await response
    })

    test("shows the server error and re-enables the form when sign in fails", async ({
      mount,
      page,
    }) => {
      await page.route(signInEndpoint, async (route) => {
        await fulfillSignIn(route, {
          status: 401,
          body: { message: "Invalid email or password." },
        })
      })

      const component = await mount(story)

      await fillCredentials(component, validCredentials())
      await submit(component)

      await expect(component.getByText("Could not sign in")).toBeVisible()
      await expect(
        component.getByText("Invalid email or password.")
      ).toBeVisible()
      await expect(
        component.getByRole("button", { name: "Sign in" })
      ).toBeEnabled()
      await expect(component.getByLabel("Email")).toBeEnabled()
      await expect(component.getByLabel("Password")).toBeEnabled()
    })

    test("shows a fallback error when the server response has no message", async ({
      mount,
      page,
    }) => {
      await page.route(signInEndpoint, async (route) => {
        await fulfillSignIn(route, { status: 500, body: {} })
      })

      const component = await mount(story)

      await fillCredentials(component, validCredentials())
      await submit(component)

      await expect(
        component.getByText("Could not sign in", { exact: true })
      ).toBeVisible()
      await expect(
        component.getByText("Could not sign in.", { exact: true })
      ).toBeVisible()
      await expect(
        component.getByRole("button", { name: "Sign in" })
      ).toBeEnabled()
    })

    test("clears the server error when the form is submitted again", async ({
      mount,
      page,
    }) => {
      const requests: string[] = []

      await page.route(signInEndpoint, async (route) => {
        requests.push(route.request().url())
        await fulfillSignIn(route, {
          status: 401,
          body: { message: "Invalid email or password." },
        })
      })

      const component = await mount(story)

      await fillCredentials(component, validCredentials())
      await submit(component)
      await expect(component.getByText("Could not sign in")).toBeVisible()

      await component.getByLabel("Email").fill("")
      await submit(component)

      await expect(component.getByText("Could not sign in")).not.toBeVisible()
      await expect(
        component.getByText("Enter a valid email address")
      ).toBeVisible()
      expect(requests).toHaveLength(1)
    })

    test("sends the credentials and navigates home when sign in succeeds", async ({
      mount,
      page,
    }) => {
      await page.route(signInEndpoint, async (route) => {
        await fulfillSignIn(route, {
          status: 200,
          body: {
            token: "token",
            user: {
              id: "user-1",
              email: "ada@example.com",
              name: "Ada Lovelace",
            },
          },
        })
      })

      const component = await mount(story)
      const requestPromise = page.waitForRequest(signInEndpoint)

      await fillCredentials(component, validCredentials())
      await submit(component)

      const body = (await requestPromise).postDataJSON()

      expect(body).toEqual({
        email: "ada@example.com",
        password: "password123",
      })
      await expect(page.locator("html")).toHaveAttribute(
        "data-navigated-to",
        "/"
      )
      await expect(
        component.getByRole("button", { name: /Signing in\.\.\./ })
      ).toBeDisabled()
    })
  })
})
