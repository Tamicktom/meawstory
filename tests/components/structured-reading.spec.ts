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
      view.getByRole("link", { name: "Revisar com esse foco", exact: true })
    ).toHaveAttribute(
      "href",
      "/dashboard/exercises/theme-1/write?textId=scene-1"
    )
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

test("identical evidence is shown once and still locates the scene", async ({
  mount,
}) => {
  const view = await mount(
    "components/feedback/structured-reading/RepeatedEvidence"
  )
  const criterion = view.getByRole("article", {
    name: "Aderência",
    exact: true,
  })
  await expect(
    criterion.getByRole("button", { name: /Ver trecho \d/ })
  ).toHaveCount(1)
  await criterion.getByRole("button", { name: /Ver trecho \d/ }).click()
  await expect(view.locator("mark:focus")).toHaveText("chave ficou na mesa")
})

for (const width of [320, 1280]) {
  test(`revision context stays on its version at ${width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    const view = await mount("components/feedback/structured-reading/Revision")
    await expect(
      view.getByRole("navigation", { name: "Versões da cena" })
    ).toBeVisible()
    const context = view.getByRole("region", { name: "Contexto da revisão" })
    await expect(context).toContainText(
      "Tornar o gesto diante da chave visível."
    )
    await expect(
      view.getByRole("link", { name: "Revisar com esse foco", exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

for (const width of [320, 390, 1280]) {
  test(`shows the revision effect and a regression beside the gains at ${width}px`, async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width, height: 850 })
    const view = await mount("components/feedback/structured-reading/Compared")
    const comparison = view.getByRole("region", {
      name: "Comparação com a versão anterior",
    })
    await expect(
      comparison.getByRole("heading", { name: "O foco foi atendido" })
    ).toBeVisible()
    await expect(comparison).toContainText(
      "O gesto de esperar aparece na versão nova."
    )
    await expect(comparison).toContainText("A chave ficou na mesa")
    await expect(comparison).toContainText(
      "Tornar o gesto diante da chave visível."
    )
    const losses = comparison.getByRole("region", { name: "O que piorou" })
    await expect(losses).toContainText("Aderência")
    await expect(losses).toContainText("Desceu")
    await expect(comparison).toContainText(
      "A pontuação total foi de 640 para 676."
    )
    await expect(
      comparison.getByRole("link", { name: "Revisar novamente", exact: true })
    ).toHaveAttribute(
      "href",
      "/dashboard/exercises/theme-1/write?textId=scene-1"
    )
    const previous = comparison.getByRole("region", {
      name: "Versão anterior",
      exact: true,
    })
    const current = comparison.getByRole("region", {
      name: "Esta versão",
      exact: true,
    })
    await expect(current).toContainText("Ela esperou.")
    if (width < 768) {
      await expect(previous).toBeHidden()
      await comparison
        .getByRole("tab", { name: "Versão anterior", exact: true })
        .click()
      await expect(previous).toBeVisible()
      await expect(current).toBeHidden()
    } else {
      await expect(previous).toBeVisible()
    }
    await expect(previous).not.toContainText("Ela esperou.")
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("does not treat an unchanged text as an improvement", async ({
  mount,
}) => {
  const view = await mount(
    "components/feedback/structured-reading/UnchangedComparison"
  )
  const comparison = view.getByRole("region", {
    name: "Comparação com a versão anterior",
  })
  await expect(comparison).toContainText(
    "O texto desta versão é igual ao da anterior. A diferença de pontuação não conta como melhora."
  )
  await expect(comparison.getByText("Subiu", { exact: true })).toHaveCount(0)
  await expect(comparison.getByText("Desceu", { exact: true })).toHaveCount(0)
  await expect(
    comparison.getByRole("region", { name: "O que piorou" })
  ).toHaveCount(0)
  await expect(
    comparison.getByText("esta diferença não conta como melhora")
  ).toHaveCount(5)
})

test("an earlier version keeps its reading and points to the latest one", async ({
  mount,
}) => {
  const view = await mount(
    "components/feedback/structured-reading/EarlierVersion"
  )
  await expect(
    view.getByRole("region", { name: "Contexto da revisão" })
  ).toHaveCount(0)
  await expect(
    view.getByRole("link", { name: "Revisar com esse foco", exact: true })
  ).toHaveCount(0)
  await expect(
    view.getByRole("link", { name: "Abrir a versão mais recente" })
  ).toHaveAttribute("href", "/dashboard/texts/scene-1")
})
