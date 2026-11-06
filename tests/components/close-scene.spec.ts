//* Local imports
import { expect, test } from "../../playwright/component"

test.describe("CloseSceneButton", () => {
  test("closes the scene from the reading", async ({ mount, page }) => {
    await page.route("**/api/scenes/text-1/close", async (route) => {
      expect(route.request().method()).toBe("POST")
      await route.fulfill({
        json: { closedAt: new Date().toISOString() },
      })
    })
    const view = await mount("components/scenes/close-scene/Open")

    await view.getByRole("button", { name: "Dar a cena por encerrada" }).click()

    await expect(
      view.getByRole("button", { name: "Reabrir cena" })
    ).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
  })

  test("reopens a closed scene", async ({ mount, page }) => {
    await page.route("**/api/scenes/text-1/reopen", async (route) => {
      expect(route.request().method()).toBe("POST")
      await route.fulfill({ json: { reopened: true } })
    })
    const view = await mount("components/scenes/close-scene/Closed")

    await view.getByRole("button", { name: "Reabrir cena" }).click()

    await expect(
      view.getByRole("button", { name: "Dar a cena por encerrada" })
    ).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
  })

  test("keeps the scene open when closing fails", async ({ mount, page }) => {
    await page.route("**/api/scenes/text-1/close", async (route) => {
      await route.fulfill({
        status: 409,
        json: {
          message:
            "A cena só pode ser encerrada depois que a leitura atual estiver concluída.",
        },
      })
    })
    const view = await mount("components/scenes/close-scene/Open")

    await view.getByRole("button", { name: "Dar a cena por encerrada" }).click()

    await expect(view.getByRole("alert")).toContainText(
      "A cena só pode ser encerrada depois que a leitura atual estiver concluída."
    )
    await expect(
      view.getByRole("button", { name: "Dar a cena por encerrada" })
    ).toBeEnabled()
  })
})
