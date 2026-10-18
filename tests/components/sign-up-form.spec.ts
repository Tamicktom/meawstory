//* Libraries imports
import { type Locator, type Page, type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"
import { expectInvalidEmail, expectNavigatedHome } from "./auth-form-steps"

const story = "components/auth/sign-up-form/Default"
const signUpEndpoint = "**/api/auth/sign-up/email"

type Account = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type JsonResponse = {
  status: number
  body: Record<string, unknown>
}

type Mount = (story: string) => Promise<Locator>

function validAccount(overrides: Partial<Account> = {}): Account {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  }
}

async function fillAccount(component: Locator, account: Account) {
  await component.getByLabel("Name").fill(account.name)
  await component.getByLabel("Email").fill(account.email)
  await component.getByLabel("Password", { exact: true }).fill(account.password)
  await component.getByLabel("Confirm password").fill(account.confirmPassword)
}

async function submit(component: Locator) {
  await component.getByRole("button", { name: "Create account" }).click()
}

async function captureSignUpRequests(page: Page) {
  const requests: string[] = []

  await page.route(signUpEndpoint, async (route) => {
    requests.push(route.request().url())
    await route.abort()
  })

  return requests
}

async function fulfillSignUp(route: Route, response: JsonResponse) {
  await route.fulfill({
    status: response.status,
    contentType: "application/json",
    body: JSON.stringify(response.body),
  })
}

async function expectPasswordAriaInvalid(component: Locator) {
  await expect(
    component.getByLabel("Password", { exact: true })
  ).toHaveAttribute("aria-invalid", "true")
}

async function expectPasswordInvalidWithConfirmUntouched(
  component: Locator,
  requests: string[]
) {
  await expectPasswordAriaInvalid(component)
  await expect(component.getByLabel("Confirm password")).not.toHaveAttribute(
    "aria-invalid"
  )
  expect(requests).toHaveLength(0)
}

async function mountFailedSignUp(
  page: Page,
  mount: Mount,
  response: JsonResponse,
  requests?: string[]
) {
  await page.route(signUpEndpoint, async (route) => {
    requests?.push(route.request().url())
    await fulfillSignUp(route, response)
  })

  const component = await mount(story)

  await fillAccount(component, validAccount())
  await submit(component)
  await expect(component.getByText("Could not create account")).toBeVisible()

  return component
}

type ComponentFixtures = {
  mount: Mount
  page: Page
}

async function showsTheAccountFields({ mount }: ComponentFixtures) {
  const component = await mount(story)

  await expect(component.getByText("Create your account")).toBeVisible()
  await expect(
    component.getByText("Enter your details to get started.")
  ).toBeVisible()
  await expect(component.getByLabel("Name")).toBeVisible()
  await expect(component.getByLabel("Email")).toBeVisible()
  await expect(component.getByLabel("Password", { exact: true })).toBeVisible()
  await expect(component.getByLabel("Confirm password")).toBeVisible()
  await expect(
    component.getByRole("button", { name: "Create account" })
  ).toBeEnabled()
}

async function showsFieldErrorsWhenTheFormIsSubmittedEmpty({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)

  await submit(component)

  await expect(component.getByText("Name is required")).toBeVisible()
  await expect(component.getByText("Enter a valid email address")).toBeVisible()
  await expect(
    component.getByText("Password must be at least 8 characters")
  ).toBeVisible()
  await expect(component.getByText("Passwords do not match")).not.toBeVisible()
  await expect(component.getByLabel("Name")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expect(component.getByLabel("Email")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expectPasswordInvalidWithConfirmUntouched(component, requests)
}

async function showsAnErrorWhenTheEmailIsInvalid({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)

  await fillAccount(component, validAccount({ email: "ada@" }))
  await submit(component)
  await expectInvalidEmail(component)
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenThePasswordIsShorterThan8Characters({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)

  await fillAccount(
    component,
    validAccount({ password: "short", confirmPassword: "short" })
  )
  await submit(component)

  await expect(
    component.getByText("Password must be at least 8 characters")
  ).toBeVisible()
  await expectPasswordInvalidWithConfirmUntouched(component, requests)
}

async function showsAnErrorWhenThePasswordIsLongerThan128Characters({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)
  const password = "a".repeat(129)

  await fillAccount(
    component,
    validAccount({ password, confirmPassword: password })
  )
  await submit(component)

  await expect(
    component.getByText("Password must be at most 128 characters")
  ).toBeVisible()
  await expectPasswordAriaInvalid(component)
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenThePasswordsDoNotMatch({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)

  await fillAccount(component, validAccount({ confirmPassword: "password124" }))
  await submit(component)

  await expect(component.getByText("Passwords do not match")).toBeVisible()
  await expect(
    component.getByLabel("Password", { exact: true })
  ).not.toHaveAttribute("aria-invalid")
  await expect(component.getByLabel("Confirm password")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  expect(requests).toHaveLength(0)
}

async function showsAnErrorWhenTheNameIsOnlyWhitespace({
  mount,
  page,
}: ComponentFixtures) {
  const requests = await captureSignUpRequests(page)
  const component = await mount(story)

  await fillAccount(component, validAccount({ name: "   " }))
  await submit(component)

  await expect(component.getByText("Name is required")).toBeVisible()
  await expect(component.getByLabel("Name")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  expect(requests).toHaveLength(0)
}

async function disablesTheFormWhileTheAccountIsBeingCreated({
  mount,
  page,
}: ComponentFixtures) {
  let continueRequest = () => {}
  const requestGate = new Promise<void>((resolve) => {
    continueRequest = resolve
  })

  await page.route(signUpEndpoint, async (route) => {
    await requestGate
    await fulfillSignUp(route, {
      status: 200,
      body: { token: "token", user: { id: "user-1" } },
    })
  })

  const component = await mount(story)
  const response = page.waitForResponse(signUpEndpoint)

  await fillAccount(component, validAccount())
  await submit(component)

  const submitButton = component.getByRole("button", {
    name: /Creating account\.\.\./,
  })

  await expect(submitButton).toBeDisabled()
  await expect(component.getByLabel("Name")).toBeDisabled()
  await expect(component.getByLabel("Email")).toBeDisabled()
  await expect(component.getByLabel("Password", { exact: true })).toBeDisabled()
  await expect(component.getByLabel("Confirm password")).toBeDisabled()

  continueRequest()
  await response
}

async function showsTheServerErrorWhenSignUpFails({
  mount,
  page,
}: ComponentFixtures) {
  const component = await mountFailedSignUp(page, mount, {
    status: 422,
    body: { message: "User already exists." },
  })

  await expect(component.getByText("User already exists.")).toBeVisible()
  await expect(
    component.getByRole("button", { name: "Create account" })
  ).toBeEnabled()
  await expect(component.getByLabel("Name")).toBeEnabled()
  await expect(component.getByLabel("Email")).toBeEnabled()
  await expect(component.getByLabel("Password", { exact: true })).toBeEnabled()
  await expect(component.getByLabel("Confirm password")).toBeEnabled()
}

async function showsAFallbackErrorWhenTheServerResponseHasNoMessage({
  mount,
  page,
}: ComponentFixtures) {
  const component = await mountFailedSignUp(page, mount, {
    status: 500,
    body: {},
  })

  await expect(
    component.getByText("Could not create your account.")
  ).toBeVisible()
  await expect(
    component.getByRole("button", { name: "Create account" })
  ).toBeEnabled()
}

async function clearsTheServerErrorWhenTheFormIsSubmittedAgain({
  mount,
  page,
}: ComponentFixtures) {
  const requests: string[] = []
  const component = await mountFailedSignUp(
    page,
    mount,
    {
      status: 422,
      body: { message: "User already exists." },
    },
    requests
  )

  await component.getByLabel("Name").fill("")
  await submit(component)

  await expect(
    component.getByText("Could not create account")
  ).not.toBeVisible()
  await expect(component.getByText("Name is required")).toBeVisible()
  expect(requests).toHaveLength(1)
}

async function sendsTheTrimmedNameAndNavigatesHome({
  mount,
  page,
}: ComponentFixtures) {
  await page.route(signUpEndpoint, async (route) => {
    await fulfillSignUp(route, {
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
  const requestPromise = page.waitForRequest(signUpEndpoint)

  await fillAccount(component, validAccount({ name: "  Ada Lovelace  " }))
  await submit(component)

  const body = (await requestPromise).postDataJSON()

  expect(body).toMatchObject({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "password123",
  })
  expect(body.confirmPassword).toBeUndefined()
  await expectNavigatedHome(page, component, "Creating account...")
}

test.describe("SignUpForm", () => {
  test.describe("rendering", () => {
    test(
      "shows the account fields and an enabled submit button",
      showsTheAccountFields
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
    test(
      "shows an error when the passwords do not match",
      showsAnErrorWhenThePasswordsDoNotMatch
    )
    test(
      "shows an error when the name is only whitespace",
      showsAnErrorWhenTheNameIsOnlyWhitespace
    )
  })

  test.describe("submission", () => {
    test(
      "disables the form while the account is being created",
      disablesTheFormWhileTheAccountIsBeingCreated
    )
    test(
      "shows the server error and re-enables the form when sign up fails",
      showsTheServerErrorWhenSignUpFails
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
      "sends the trimmed name and navigates home when sign up succeeds",
      sendsTheTrimmedNameAndNavigatesHome
    )
  })
})
