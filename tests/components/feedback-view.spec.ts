//* Local imports
import { expect, test } from "../../playwright/component"

const themeTitle = "A letter that arrives late"

test.describe("FeedbackView", () => {
  test.describe("when the correction is ready", () => {
    test("shows the score, the feedback, and the corrected text", async ({
      mount,
    }) => {
      const component = await mount("components/feedback/feedback-view/Ready")

      await expect(
        component.getByRole("heading", { name: themeTitle })
      ).toBeVisible()
      await expect(component.getByText("Nota 720 de 1000")).toBeVisible()
      await expect(
        component.getByText("O texto entrega a carta", { exact: false })
      ).toBeVisible()
      await expect(
        component.getByText("The letter sat on the table.")
      ).toBeVisible()
    })
  })

  test.describe("when the correction is still pending", () => {
    test("shows that the correction is still being prepared", async ({
      mount,
    }) => {
      const component = await mount("components/feedback/feedback-view/Pending")

      await expect(
        component.getByRole("heading", { name: themeTitle })
      ).toBeVisible()
      await expect(
        component.getByText("A correção ainda está sendo preparada.")
      ).toBeVisible()
      await expect(component.getByText("Nota 720 de 1000")).toHaveCount(0)
      await expect(
        component.getByText("The letter sat on the table.")
      ).toHaveCount(0)
    })
  })
})
