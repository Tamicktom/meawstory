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

for (const width of [320, 1280]) {
  test(`revision keeps the focus visible and sends an optional intention at ${width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    const bodies: Record<string, unknown>[] = []
    await page.route("**/api/write/**", async (route) => {
      bodies.push(route.request().postDataJSON())
      await route.fulfill({ json: { textId: "scene-1" } })
    })
    const view = await mount("components/write/editor/Revision")
    await expect(view.getByText("Versão 2 · rascunho")).toBeVisible()
    await expect(
      view.getByRole("complementary", { name: "Foco da revisão" })
    ).toContainText("Mostre um gesto diante da chave antes da decisão.")
    await expect(view.getByText("Informações do exercício")).toHaveCount(0)
    await view.getByRole("button", { name: "Modo foco", exact: true }).click()
    await expect(
      view.getByRole("complementary", { name: "Foco da revisão" })
    ).toBeVisible()
    await view.getByRole("button", { name: "Sair do modo foco" }).click()
    await view.getByLabel("Sua cena", { exact: true }).fill(content)
    await view
      .getByRole("button", { name: "Enviar para leitura", exact: true })
      .click()
    const review = view.getByRole("region", { name: "Conferir envio" })
    await expect(review).toContainText("Não informada")
    await view.getByRole("button", { name: "Voltar a escrever" }).click()
    await view
      .getByLabel("O que você tentou mudar? (opcional)")
      .fill("Tornar o gesto visível.")
    await view
      .getByRole("button", { name: "Enviar para leitura", exact: true })
      .click()
    await expect(review).toContainText("Tornar o gesto visível.")
    await view
      .getByRole("button", { name: "Confirmar envio", exact: true })
      .click()
    await expect(page.locator("html")).toHaveAttribute(
      "data-navigated-to",
      "/dashboard/texts/scene-1"
    )
    expect(bodies.at(-1)).toMatchObject({
      content,
      draftOnly: false,
      revisionIntent: "Tornar o gesto visível.",
      textId: "scene-1",
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}
