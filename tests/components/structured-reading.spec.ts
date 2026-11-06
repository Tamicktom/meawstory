import { expect, test } from "../../playwright/component"

for (const width of [320, 390, 1280]) {
  test(`structured reading and overlapping evidence at ${width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    const view = await mount("components/feedback/structured-reading/Ready")
    await expect(
      view.getByRole("heading", { name: "A escolha", exact: true })
    ).toBeVisible()
    await expect(
      view.getByRole("heading", { name: "Leitura geral", exact: true })
    ).toBeVisible()
    await expect(
      view.getByText("Pontuação: 640 de 1000", { exact: true })
    ).not.toBeVisible()
    await expect(
      view.getByRole("button", { name: "Revisar com esse foco", exact: true })
    ).toBeDisabled()
    const criterion = view.getByRole("article", {
      name: "Aderência",
      exact: true,
    })
    await expect(criterion.getByText("Funciona", { exact: true })).toBeVisible()
    await criterion
      .getByRole("button", { name: /Ver trecho 2 na cena/ })
      .click()
    const scene = view.getByRole("region", { name: "Sua cena", exact: true })
    await expect(scene).toBeVisible()
    await expect(scene.locator("mark:focus")).toHaveText("Ela esperou.")
    expect(await scene.locator(".whitespace-pre-wrap").textContent()).toBe(
      "A chave ficou na mesa entre as duas.\n\nEla esperou. A chave ficou na mesa entre as duas.\n\nFim."
    )
    if (width < 768)
      await scene.getByRole("button", { name: "Voltar à leitura" }).click()
    await view.getByText("Ver pontuação total", { exact: true }).click()
    await expect(
      view.getByText("Pontuação: 640 de 1000", { exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("saves and corrects usefulness, retains failed disagreement and allows retry", async ({
  mount,
  page,
}) => {
  const bodies: object[] = []
  let fail = false
  await page.route("**/api/reading-feedback/reading-1", async (route) => {
    bodies.push(route.request().postDataJSON())
    await route.fulfill({ status: fail ? 500 : 200, json: { saved: !fail } })
  })
  const view = await mount("components/feedback/structured-reading/Ready")
  const utility = view.getByRole("region", { name: "Utilidade da leitura" })
  await utility.getByRole("button", { name: "Sim", exact: true }).click()
  await expect(
    utility.getByRole("button", { name: "Sim", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await utility.getByRole("button", { name: "Em parte" }).click()
  await expect(
    utility.getByRole("button", { name: "Em parte" })
  ).toHaveAttribute("aria-pressed", "true")
  const criterion = view.getByRole("article", {
    name: "Aderência",
    exact: true,
  })
  await criterion.getByText("Discordo deste critério", { exact: true }).click()
  await criterion.getByRole("textbox").fill("Não reconheço essa interpretação.")
  fail = true
  await criterion
    .getByRole("button", { name: "Registrar discordância" })
    .click()
  await expect(criterion.getByRole("alert")).toContainText("Tente novamente")
  await expect(criterion.getByRole("textbox")).toHaveValue(
    "Não reconheço essa interpretação."
  )
  fail = false
  await criterion
    .getByRole("button", { name: "Registrar discordância" })
    .click()
  await expect(criterion.getByRole("status")).toContainText(
    "Discordância registrada"
  )
  expect(bodies).toContainEqual({ usefulness: "yes" })
  expect(bodies).toContainEqual({ usefulness: "partly" })
  expect(bodies).toContainEqual({
    criterionId: "criterion-0",
    reason: "Não reconheço essa interpretação.",
  })
})

test("restores persisted responses and handles expired sessions", async ({
  mount,
  page,
}) => {
  await page.route("**/api/reading-feedback/reading-1", (route) =>
    route.fulfill({ status: 401, json: {} })
  )
  const view = await mount("components/feedback/structured-reading/Saved")
  await expect(view.getByRole("button", { name: "Em parte" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  const criterion = view.getByRole("article", {
    name: "Aderência",
    exact: true,
  })
  await criterion
    .getByText("Discordo deste critério — registrada", { exact: true })
    .click()
  await expect(criterion.getByRole("textbox")).toHaveValue(
    "Minha intenção foi outra."
  )
  await view.getByRole("button", { name: "Não", exact: true }).click()
  await expect(view.getByRole("alert")).toContainText("Sua sessão expirou")
  await expect(view.getByRole("button", { name: "Em parte" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
})

test("long content fits mobile and tabs support keyboard navigation", async ({
  mount,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 })
  const view = await mount("components/feedback/structured-reading/Long")
  await view.getByRole("tab", { name: "Leitura", exact: true }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(
    view.getByRole("tab", { name: "Cena", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await expect(
    view.getByRole("region", { name: "Sua cena", exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.keyboard.press("ArrowLeft")
  await view
    .getByRole("button", { name: "Ver trechos de Aderência", exact: true })
    .click()
  await expect(view.locator("mark:focus")).toHaveText("chave ficou na mesa")
})
