import { expect, test } from "@playwright/test"
import { signIn } from "../helpers/sign-in"

test("an unknown route offers a return to the start", async ({ page }) => {
  await page.goto("/pagina-inexistente")
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" })
  ).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR")
  await page.getByRole("link", { name: "Voltar para o Início" }).click()
  await expect(page).toHaveURL("/sign-in")
})

test("missing exercises and scenes keep navigation and a route home", async ({
  page,
}) => {
  await signIn(page)
  for (const path of [
    "/dashboard/themes/missing-exercise",
    "/dashboard/exercises/missing-exercise/write",
    "/dashboard/texts/missing-scene",
  ]) {
    await page.goto(path)
    await expect(
      page.getByRole("heading", { name: "Página não encontrada" })
    ).toBeVisible()
    await expect(page.locator("#sidebar-brand")).toBeVisible()
    await page.getByRole("link", { name: "Voltar para o Início" }).click()
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  }
})
