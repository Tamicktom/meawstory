import { expect, test } from "../../playwright/component"

for (const width of [320, 390]) {
  test.describe(`mobile at ${width}px`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    })

    for (const state of ["Completed", "Pending", "Failed", "Draft"]) {
      test(`keeps the entire ${state} reading within the screen`, async ({
        mount,
        page,
      }) => {
        const view = await mount(`components/reading/mobile-reading/${state}`)
        await expect(view.getByText(/Fim da cena enviada/)).toBeVisible()
        if (state === "Completed") {
          await expect(
            view.getByText("Pontuação: 640,50 de 1000")
          ).toBeVisible()
          await expect(view.getByText("Fim da leitura.")).toBeVisible()
        }
        if (state === "Failed" || state === "Draft") {
          const action = view.getByRole("button")
          await expect(action).toBeEnabled()
          const box = await action.boundingBox()
          expect(box).not.toBeNull()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width)
      })
    }

    test("can write paragraphs and submit using touch", async ({
      mount,
      page,
    }) => {
      await page.route("**/api/write/**", (route) =>
        route.fulfill({ json: { textId: "saved" } })
      )
      const view = await mount("components/write/editor/Default")
      const content =
        "Uma cena de ficção. ".repeat(30) + "\n\nÚltimo parágrafo."
      await view
        .getByRole("textbox", { name: "Sua cena", exact: true })
        .fill(content)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width)
      await view
        .getByRole("button", { name: "Enviar para leitura", exact: true })
        .tap()
      await expect(
        view.getByRole("region", { name: "Conferir envio" })
      ).toBeVisible()
      await view
        .getByRole("button", { name: "Confirmar envio", exact: true })
        .tap()
      await expect(page.locator("html")).toHaveAttribute(
        "data-navigated-to",
        "/dashboard/texts/saved"
      )
    })
  })
}
