//* Libraries imports
import { expect, test } from "@playwright/test"

test.describe("Button", () => {
  test("renders the default story", { tag: "@smoke" }, async ({ mount }) => {
    const component = await mount("components/ui/button/button/Default")

    await expect(component.getByRole("button", { name: "Save" })).toBeVisible()
  })
})
