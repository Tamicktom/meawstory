//* Libraries imports
import { type Locator, type Page, type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"
import { expectInvalidEmail, expectNavigatedHome } from "./auth-form-steps"

const story = "components/auth/sign-in-form/Default"
const signInEndpoint = "**/api/auth/sign-in/email"

type Credentials = {
  email: string
  password: string
}

type JsonResponse = {
  status: number
  body: Record<string, unknown>
}

type Mount = (story: string) => Promise<Locator>

function validCredentials(overrides: Partial<Credentials> = {}): Credentials {
  return {
    email: "ada@example.com",
    password: "password123",
    ...overrides,
  }
}

async function fillCredentials(component: Locator, credentials: Credentials) {
  await component.getByLabel("E-mail").fill(credentials.email)
  await component.getByLabel("Senha").fill(credentials.password)
}

async function submit(component: Locator) {
  await component.getByRole("button", { name: "Entrar" }).click()
}

async function captureSignInRequests(page: Page) {
  const requests: string[] = []

  await page.route(signInEndpoint, async (route) => {
    requests.push(route.request().url())
    await route.abort()
  })

  return requests
}

async function fulfillSignIn(route: Route, response: JsonResponse) {
  await route.fulfill({
    status: response.status,
    contentType: "application/json",
    body: JSON.stringify(response.body),
  })
}

async function mountFailedSignIn(
  page: Page,
  mount: Mount,
  response: JsonResponse,
  requests?: string[]
) {
  await page.route(signInEndpoint, async (route) => {
    requests?.push(route.request().url())
    await fulfillSignIn(route, response)
  })

  const component = await mount(story)

  await fillCredentials(component, validCredentials())
  await submit(component)
  await expect(
    component.getByText("Não foi possível entrar", { exact: true })
  ).toBeVisible()

  return component
}

type ComponentFixtures = {
  mount: Mount
  page: Page
}

async function showsTheSignInFields({ mount }: ComponentFixtures) {
  const component = await mount(story)

  await expect(component.getByText("Entre na sua conta")).toBeVisible()
  await expect(
    component.getByText("Use seu e-mail e sua senha para continuar.")
  ).toBeVisible()
  await expect(component.getByLabel("E-mail")).toBeVisible()
  await expect(component.getByLabel("Senha")).toBeVisible()
  await expect(component.getByRole("button", { name: "Entrar" })).toBeEnabled()
  await expect(
    component.getByRole("link", { name: "Criar uma conta" })
  ).toHaveAttribute("href", "/sign-up")
  await expect(
    component.getByRole("link", { name: "Esqueci minha senha" })
  ).toHaveAttribute("href", "/forgot-password")
}

async function keepsTheDestinationInTheLinkToSignUp({
  mount,
}: ComponentFixtures) {
  const component = await mount("components/auth/sign-in-form/WithDestination")

  await expect(
    component.getByRole("link", { name: "Criar uma conta" })
  ).toHaveAttribute("href", "/sign-up?next=%2Fdashboard%2Fthemes")
}

async function navigatesToTheDestinationAfterSigningIn({
  mount,
  page,
}: ComponentFixtures) {
  await page.route(signInEndpoint, async (route) => {
    await fulfillSignIn(route, {
      status: 200,
      body: { token: "token", user: { id: "user-1" } },
    })
  })

  const component = await mount("components/auth/sign-in-form/WithDestination")

  await fillCredentials(component, validCredentials())
  await submit(component)

  await expect(page.locator("html")).toHaveAttribute(
    "data-navigated-to",
    "/dashboard/themes"
  )
}

async function showsFieldErrorsWhenTheFormIsSubmittedEmpty({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignInRequests(page)
  const component = await mount(story)

  await submit(component)

  await expect(component.getByText("Informe um e-mail válido")).toBeVisible()
  await expect(
    component.getByText("A senha precisa ter pelo menos 8 caracteres")
  ).toBeVisible()
  await expect(component.getByLabel("E-mail")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expect(component.getByLabel("Senha")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenTheEmailIsInvalid({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignInRequests(page)
  const component = await mount(story)

  await fillCredentials(component, validCredentials({ email: "ada@" }))
  await submit(component)
  await expectInvalidEmail(component)
  await expect(component.getByLabel("Senha")).not.toHaveAttribute(
    "aria-invalid"
  )
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenThePasswordIsShorterThan8Characters({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignInRequests(page)
  const component = await mount(story)

  await fillCredentials(component, validCredentials({ password: "short" }))
  await submit(component)

  await expect(
    component.getByText("A senha precisa ter pelo menos 8 caracteres")
  ).toBeVisible()
  await expect(component.getByLabel("Senha")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expect(component.getByLabel("E-mail")).not.toHaveAttribute(
    "aria-invalid"
  )
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenThePasswordIsLongerThan128Characters({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignInRequests(page)
  const component = await mount(story)

  await fillCredentials(
    component,
    validCredentials({ password: "a".repeat(129) })
  )
  await submit(component)

  await expect(
    component.getByText("A senha pode ter no máximo 128 caracteres")
  ).toBeVisible()
  await expect(component.getByLabel("Senha")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  expect(requests).toHaveLength(0)
}

async function disablesTheFormWhileSigningIn({
  mount,
  page,
}: ComponentFixtures) {
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
    name: /Entrando…/,
  })

  await expect(submitButton).toBeDisabled()
  await expect(component.getByLabel("E-mail")).toBeDisabled()
  await expect(component.getByLabel("Senha")).toBeDisabled()

  continueRequest()
  await response
}

async function showsTheServerErrorWhenSignInFails({
  mount,
  page,
}: ComponentFixtures) {
  const component = await mountFailedSignIn(page, mount, {
    status: 401,
    body: { message: "Invalid email or password." },
  })

  await expect(component.getByText("E-mail ou senha incorretos.")).toBeVisible()
  await expect(component.getByRole("button", { name: "Entrar" })).toBeEnabled()
  await expect(component.getByLabel("E-mail")).toBeEnabled()
  await expect(component.getByLabel("Senha")).toBeEnabled()
}

async function showsAFallbackErrorWhenTheServerResponseHasNoMessage({
  mount,
  page,
}: ComponentFixtures) {
  const component = await mountFailedSignIn(page, mount, {
    status: 500,
    body: {},
  })

  await expect(
    component.getByText(
      "Não foi possível entrar agora. Tente de novo em instantes.",
      { exact: true }
    )
  ).toBeVisible()
  await expect(component.getByRole("button", { name: "Entrar" })).toBeEnabled()
}

async function clearsTheServerErrorWhenTheFormIsSubmittedAgain({
  mount,
  page,
}: ComponentFixtures) {
  const requests: string[] = []
  const component = await mountFailedSignIn(
    page,
    mount,
    {
      status: 401,
      body: { message: "Invalid email or password." },
    },
    requests
  )

  await component.getByLabel("E-mail").fill("")
  await submit(component)

  await expect(component.getByText("Não foi possível entrar")).not.toBeVisible()
  await expect(component.getByText("Informe um e-mail válido")).toBeVisible()
  expect(requests).toHaveLength(1)
}

async function sendsTheCredentialsAndNavigatesHome({
  mount,
  page,
}: ComponentFixtures) {
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
  await expectNavigatedHome(page, component, "Entrando…")
}

test.describe("SignInForm", () => {
  test.describe("rendering", () => {
    test(
      "shows the sign in fields and an enabled submit button",
      showsTheSignInFields
    )
    test(
      "keeps the destination in the link to sign up",
      keepsTheDestinationInTheLinkToSignUp
    )
  })

  test.describe("validation", () => {
    test(
      "shows field errors when the form is submitted empty",
      showsFieldErrorsWhenTheFormIsSubmittedEmpty
    )
    test(
      "shows an error when the email is invalid",
      showsAnErrorWhenTheEmailIsInvalid
    )
    test(
      "shows an error when the password is shorter than 8 characters",
      showsAnErrorWhenThePasswordIsShorterThan8Characters
    )
    test(
      "shows an error when the password is longer than 128 characters",
      showsAnErrorWhenThePasswordIsLongerThan128Characters
    )
  })

  test.describe("submission", () => {
    test("disables the form while signing in", disablesTheFormWhileSigningIn)
    test(
      "shows the server error and re-enables the form when sign in fails",
      showsTheServerErrorWhenSignInFails
    )
    test(
      "shows a fallback error when the server response has no message",
      showsAFallbackErrorWhenTheServerResponseHasNoMessage
    )
    test(
      "clears the server error when the form is submitted again",
      clearsTheServerErrorWhenTheFormIsSubmittedAgain
    )
    test(
      "sends the credentials and navigates home when sign in succeeds",
      sendsTheCredentialsAndNavigatesHome
    )
    test(
      "navigates to the destination after signing in",
      navigatesToTheDestinationAfterSigningIn
    )
  })
})
