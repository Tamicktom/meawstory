//* Libraries imports
import { type Locator, type Page } from "@playwright/test"

//* Local imports
import { expect } from "../../playwright/component"

async function expectInvalidEmail(component: Locator) {
  await expect(component.getByText("Informe um e-mail válido")).toBeVisible()
  await expect(component.getByLabel("E-mail")).toHaveAttribute(
    "aria-invalid",
    "true"
  )
}

async function expectNavigatedHome(
  page: Page,
  component: Locator,
  busyButtonName: string
) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-navigated-to",
    "/dashboard"
  )
  await expect(
    component.getByRole("button", { name: busyButtonName })
  ).toBeDisabled()
}

export { expectInvalidEmail, expectNavigatedHome }
