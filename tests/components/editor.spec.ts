import { expect, test } from "../../playwright/component"
const story = "components/write/editor/Default"
const content =
  "Uma cena de ficção. ".repeat(30).trim() + "\n\nOutro parágrafo."
test("starts empty with a placeholder and rejects short scenes locally", async ({
  mount,
  page,
}) => {
  let requests = 0
  await page.route("**/api/write/**", (route) => {
    requests++
    return route.fulfill({ json: { textId: "saved" } })
  })
  const view = await mount(story)
  await expect(view.getByRole("textbox")).toHaveValue("")
  await expect(view.getByRole("textbox")).toHaveAttribute(
    "placeholder",
    "Comece no meio da cena."
  )
  await view.getByRole("textbox").fill("Curta.")
  await view.getByRole("button").click()
  await expect(view.getByRole("alert")).toContainText("1 palavras")
  await expect(view.getByRole("textbox")).toHaveValue("Curta.")
  expect(requests).toBe(0)
})
test("preserves paragraphs, opens saved scenes and keeps the text on rate limiting", async ({
  mount,
  page,
}) => {
  const bodies: { content: string; textId?: string }[] = []
  await page.route("**/api/write/**", async (route) => {
    bodies.push(route.request().postDataJSON())
    await route.fulfill({
      status: bodies.length === 1 ? 429 : 200,
      json:
        bodies.length === 1
          ? {
              textId: "saved",
              message: "Tente de novo em 10 minutos. Sua cena continua salva.",
            }
          : { textId: "saved" },
    })
  })
  const view = await mount(story)
  await view.getByRole("textbox").fill(content)
  await view.getByRole("button").click()
  await expect(view.getByRole("alert")).toContainText("10 minutos")
  await expect(view.getByRole("textbox")).toHaveValue(content)
  await view.getByRole("button").click()
  await expect(page.locator("html")).toHaveAttribute(
    "data-navigated-to",
    "/dashboard/texts/saved"
  )
  expect(bodies).toEqual([{ content }, { content, textId: "saved" }])
})
