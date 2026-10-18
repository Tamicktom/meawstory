//* Libraries imports
import { type Locator, type Page } from "@playwright/test"

//* Local imports
import { expect } from "../../playwright/component"

async function expectInvalidEmail(component: Locator) {
  await expect(component.getByText("Enter a valid email address")).toBeVisible()
  await expect(component.getByLabel("Email")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
}

async function expectNavigatedHome(
  page: Page,
  component: Locator,
  busyButtonName: string
) {
  await expect(page.locator("html")).toHaveAttribute("data-navigated-to", "/")
  await expect(
    component.getByRole("button", { name: busyButtonName })
  ).toBeDisabled()
}

export { expectInvalidEmail, expectNavigatedHome }
