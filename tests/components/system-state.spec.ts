import { expect, test } from "../../playwright/component"

test("unexpected errors offer a working retry without exposing technical details", async ({
  mount,
}) => {
  const view = await mount("components/system/system-state/UnexpectedError")
  await expect(view.getByRole("alert")).toContainText("problema inesperado")
  await expect(
    view.getByText("As cenas já salvas não foram alteradas por este erro.")
  ).toBeVisible()
  await expect(view).not.toContainText("secret-123")
  await expect(
    view.getByRole("link", { name: "Voltar para o Início" })
  ).toHaveAttribute("href", "/dashboard")
  await view.getByRole("button", { name: "Tentar novamente" }).click()
  await expect(view.getByRole("status")).toHaveText("Página recuperada")
})

test("loading identifies the current flow and offers a way home", async ({
  mount,
}) => {
  const view = await mount("components/system/system-state/Loading")
  await expect(view.getByRole("status")).toHaveText(
    "Carregando sua cena e leitura…"
  )
  await expect(view.locator('[aria-busy="true"]')).toBeVisible()
  await expect(
    view.getByRole("link", { name: "Voltar para o Início" })
  ).toHaveAttribute("href", "/dashboard")
})
