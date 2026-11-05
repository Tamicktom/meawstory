import { expect, test } from "../../playwright/component"
for (const [story, message] of [
  ["Pending", "aguardando"],
  ["Delayed", "mais tempo que o normal"],
  ["Failed", "tentativa não conta"],
]) {
  test(`${story} keeps the scene without a score`, async ({ mount }) => {
    const view = await mount(`components/reading/reading-state/${story}`)
    await expect(view.getByRole("status")).toContainText(message)
    await expect(view.getByRole("link", { name: "Minhas cenas" })).toBeVisible()
    await expect(view.getByText(/Nota|de 1000/)).toHaveCount(0)
    await expect(
      view.getByRole("button", { name: "Tentar de novo" })
    ).toHaveCount(story === "Failed" ? 1 : 0)
  })
}
test("failed scene retry refreshes without writing a new scene", async ({
  mount,
  page,
}) => {
  let starts = 0
  await page.route("**/api/correction/start/text-1", async (route) => {
    starts++
    await route.fulfill({ json: { textId: "text-1" } })
  })
  const view = await mount("components/reading/reading-state/Failed")
  await view.getByRole("button", { name: "Tentar de novo" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-refreshed", "true")
  expect(starts).toBe(1)
  await expect(view.getByText("Cena salva.")).toBeVisible()
})
