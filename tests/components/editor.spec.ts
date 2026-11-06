import { expect, test } from "../../playwright/component"
const story = "components/write/editor/Default"
const content =
  "Uma cena de ficção. ".repeat(30).trim() + "\n\nOutro parágrafo."

test("autosaves short drafts and preserves the confirmed identity", async ({
  mount,
  page,
}) => {
  const bodies: Record<string, unknown>[] = []
  await page.route("**/api/write/**", async (route) => {
    bodies.push(route.request().postDataJSON())
    await route.fulfill({ json: { textId: "saved" } })
  })
  const view = await mount(story)
  await view.getByLabel("Sua cena", { exact: true }).fill("Curta.")
  await expect(view.getByRole("status")).toContainText("Salvo há instantes")
  await view.getByLabel("Título da cena (opcional)").fill("Uma porta")
  await expect.poll(() => bodies.length).toBe(2)
  expect(bodies[1]).toMatchObject({
    textId: "saved",
    draftOnly: true,
    title: "Uma porta",
    content: "Curta.",
  })
  await view
    .getByRole("button", { name: "Enviar para leitura", exact: true })
    .click()
  await expect(view.getByRole("alert")).toContainText("1 palavras")
})

test("requires confirmation and keeps unsaved content after network failure", async ({
  mount,
  page,
}) => {
  await page.route("**/api/write/**", (route) =>
    route.fulfill({ status: 503, json: {} })
  )
  const view = await mount(story)
  await view.getByLabel("Sua cena", { exact: true }).fill(content)
  await expect(view.getByRole("alert")).toContainText(
    "Mantenha esta página aberta"
  )
  await expect(view.getByLabel("Sua cena", { exact: true })).toHaveValue(
    content
  )
  await view
    .getByRole("button", { name: "Enviar para leitura", exact: true })
    .click()
  await expect(
    view.getByRole("region", { name: "Conferir envio" })
  ).toBeVisible()
  await view.getByRole("button", { name: "Voltar a escrever" }).click()
  await expect(view.getByLabel("Sua cena", { exact: true })).toHaveValue(
    content
  )
  await view.getByRole("button", { name: "Modo foco", exact: true }).click()
  await expect(
    view.getByRole("button", { name: "Sair do modo foco" })
  ).toBeVisible()
})

test("submission waits for save and sends exactly the confirmed paragraphs", async ({
  mount,
  page,
}) => {
  const bodies: Record<string, unknown>[] = []
  await page.route("**/api/write/**", async (route) => {
    bodies.push(route.request().postDataJSON())
    await route.fulfill({ json: { textId: "saved" } })
  })
  const view = await mount(story)
  await view.getByLabel("Sua cena", { exact: true }).fill(content)
  await view
    .getByRole("button", { name: "Enviar para leitura", exact: true })
    .click()
  await view
    .getByRole("button", { name: "Confirmar envio", exact: true })
    .click()
  await expect(page.locator("html")).toHaveAttribute(
    "data-navigated-to",
    "/dashboard/texts/saved"
  )
  expect(bodies.at(-1)).toMatchObject({ content, draftOnly: false })
})
