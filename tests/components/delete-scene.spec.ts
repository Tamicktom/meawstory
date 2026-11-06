//* Local imports
import { expect, test } from "../../playwright/component"

test.describe("DeleteSceneButton", () => {
  test("refreshes Minhas cenas after the scene is retired", async ({
    mount,
    page,
  }) => {
    await page.route("**/api/scenes/text-1/retire", async (route) => {
      expect(route.request().method()).toBe("POST")
      await route.fulfill({
        json: { deletedAt: new Date().toISOString() },
      })
    })
    const view = await mount("components/scenes/delete-scene/Button")

    await view.getByRole("button", { name: "Excluir cena" }).click()

    await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
  })

  test("opens Minhas cenas when the scene itself is retired", async ({
    mount,
    page,
  }) => {
    await page.route("**/api/scenes/text-1/retire", async (route) => {
      await route.fulfill({
        json: { deletedAt: new Date().toISOString() },
      })
    })
    const view = await mount("components/scenes/delete-scene/Button", {
      redirectTo: "/dashboard/texts",
    })

    await view.getByRole("button", { name: "Excluir cena" }).click()

    await expect(page.locator("html")).toHaveAttribute(
      "data-navigated-to",
      "/dashboard/texts"
    )
  })

  test("shows the server message when the scene cannot be retired", async ({
    mount,
    page,
  }) => {
    await page.route("**/api/scenes/text-1/retire", async (route) => {
      await route.fulfill({
        status: 404,
        json: { message: "Esta cena não está disponível para sua conta." },
      })
    })
    const view = await mount("components/scenes/delete-scene/Button")

    await view.getByRole("button", { name: "Excluir cena" }).click()

    await expect(view.getByRole("alert")).toHaveText(
      "Esta cena não está disponível para sua conta."
    )
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-refreshed",
      "true"
    )
  })
})

test.describe("DeletedSceneNotice", () => {
  test("undoes the retirement and refreshes the list", async ({
    mount,
    page,
  }) => {
    await page.route("**/api/scenes/text-1/restore", async (route) => {
      expect(route.request().method()).toBe("POST")
      await route.fulfill({ json: { restored: true } })
    })
    const view = await mount("components/scenes/delete-scene/Notice")

    await expect(view.getByRole("status")).toContainText("Cena excluída.")
    await expect(view.getByText("A chave na mesa")).toBeVisible()
    await view.getByRole("button", { name: "Desfazer" }).click()

    await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
  })

  test("says an in-progress reading will not finish", async ({ mount }) => {
    const view = await mount(
      "components/scenes/delete-scene/NoticeWhileReading"
    )

    await expect(view.getByRole("status")).toContainText("Cena excluída.")
    await expect(view.getByRole("status")).toContainText(
      "A leitura em andamento não será concluída."
    )
  })

  test("hides the notice after the undo window", async ({ mount }) => {
    const view = await mount("components/scenes/delete-scene/ExpiredNotice")

    await expect(view.getByRole("status")).toHaveCount(0)
    await expect(view.getByRole("button", { name: "Desfazer" })).toHaveCount(0)
  })
})
