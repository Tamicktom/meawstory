//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { signIn } from "../helpers/sign-in"

test.describe("dashboard session gate", () => {
  test("sends a visitor with no session to sign in, without the shell", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    await expect(page).toHaveURL("/sign-in")
    await expect(page.getByText("Unauthorized")).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Meawstory" })).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Alternar menu" })
    ).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Sair" })).toHaveCount(0)
  })

  test("shows the sidebar, the trigger, and the page when the visitor is signed in", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("link", { name: "Meawstory" })).toBeVisible()
    await expect(page.locator("#sidebar-dashboard")).toBeVisible()
    await expect(page.locator("#sidebar-themes")).toBeVisible()
    await expect(page.locator("#sidebar-texts")).toBeVisible()
    await expect(page.locator("#sidebar-account")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Alternar menu" })
    ).toBeVisible()
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
    await expect(
      page.getByText(
        "Escolha um exercício, escreva uma cena e receba uma leitura com base"
      )
    ).toBeVisible()
    await expect(
      page.getByText("no que será observado nesse exercício.", {
        exact: false,
      })
    ).toBeVisible()
    await expect(page.getByText(/será observado/)).toBeVisible()
  })

  test("links Explorar exercícios to the theme catalog", async ({ page }) => {
    await signIn(page)
    await page.goto("/dashboard")

    const browseThemes = page.locator("#dashboard-browse-themes")

    await expect(browseThemes).toHaveText("Explorar exercícios")
    await expect(browseThemes).toHaveAttribute("href", "/dashboard/themes")

    await browseThemes.click()

    await expect(page).toHaveURL("/dashboard/themes")
    await expect(
      page.getByRole("heading", { name: "Exercícios" })
    ).toBeVisible()
  })

  test("links Your texts to the text history", async ({ page }) => {
    await signIn(page)
    await page.goto("/dashboard")

    const yourTexts = page.locator("#dashboard-your-texts")

    await expect(yourTexts).toHaveText("Minhas cenas")
    await expect(yourTexts).toHaveAttribute("href", "/dashboard/texts")

    await yourTexts.click()

    await expect(page).toHaveURL("/dashboard/texts")
    await expect(
      page.getByRole("heading", { name: "Minhas cenas" })
    ).toBeVisible()
  })

  test("opens Conta with the signed-in name and email, then signs out", async ({
    page,
  }) => {
    const account = await signIn(page)
    await page.goto("/dashboard")

    await page.locator("#sidebar-account").click()

    await expect(page).toHaveURL("/dashboard/account")
    await expect(page.getByRole("heading", { name: "Conta" })).toBeVisible()
    await expect(page.locator("#account-name")).toHaveText(account.name)
    await expect(page.locator("#account-email")).toHaveText(account.email)
    await expect(page.getByRole("textbox")).toHaveCount(0)

    const signOut = page.getByRole("button", { name: "Sair", exact: true })

    await expect(signOut).toHaveAttribute("id", "account-sign-out")
    await expect(signOut).toHaveAttribute("type", "button")

    await signOut.click()

    await expect(page).toHaveURL("/sign-in")
    await expect(page.getByRole("link", { name: "Meawstory" })).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Alternar menu" })
    ).toHaveCount(0)

    const session = await page.request.get("/api/auth/get-session")
    expect(session.ok()).toBeTruthy()
    expect(await session.json()).toBeNull()
  })
})

test.describe("dashboard sidebar", () => {
  test("links the brand and Dashboard to /dashboard and Themes to the catalog", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/dashboard/themes")

    await expect(page.locator("#sidebar-brand")).toHaveAttribute(
      "href",
      "/dashboard"
    )
    await expect(page.locator("#sidebar-dashboard")).toHaveAttribute(
      "href",
      "/dashboard"
    )
    await expect(page.locator("#sidebar-themes")).toHaveAttribute(
      "href",
      "/dashboard/themes"
    )
    await expect(page.locator("#sidebar-texts")).toHaveAttribute(
      "href",
      "/dashboard/texts"
    )
    await expect(page.locator("#sidebar-account")).toHaveAttribute(
      "href",
      "/dashboard/account"
    )

    await page.locator("#sidebar-dashboard").click()

    await expect(page).toHaveURL("/dashboard")
    await expect(page.getByRole("heading", { name: "Início" })).toBeVisible()
  })

  test("marks Dashboard active only on that path and keeps Themes active on nested paths", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/dashboard")

    await expect(page.locator("#sidebar-dashboard")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-themes")).not.toHaveAttribute(
      "data-active"
    )

    await page.goto("/dashboard/themes")

    await expect(page.locator("#sidebar-themes")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-dashboard")).not.toHaveAttribute(
      "data-active"
    )

    await page.goto("/dashboard/themes/missing-theme")

    await expect(page.locator("#sidebar-themes")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-dashboard")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-texts")).not.toHaveAttribute(
      "data-active"
    )

    await page.goto("/dashboard/texts")

    await expect(page.locator("#sidebar-texts")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-dashboard")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-themes")).not.toHaveAttribute(
      "data-active"
    )
    await expect(
      page.getByRole("heading", { name: "Minhas cenas" })
    ).toBeVisible()

    await page.goto("/dashboard/texts/missing-text")

    await expect(page.locator("#sidebar-texts")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-dashboard")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-themes")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-account")).not.toHaveAttribute(
      "data-active"
    )

    await page.goto("/dashboard/account")

    await expect(page.locator("#sidebar-account")).toHaveAttribute(
      "data-active",
      ""
    )
    await expect(page.locator("#sidebar-account")).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(page.locator("#sidebar-dashboard")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-themes")).not.toHaveAttribute(
      "data-active"
    )
    await expect(page.locator("#sidebar-texts")).not.toHaveAttribute(
      "data-active"
    )
    await expect(
      page.getByRole("heading", { name: "Conta" })
    ).toBeVisible()
  })

  test("hides the sidebar during focus mode and restores it afterwards", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/dashboard/exercises/theme_key_on_the_table/write")

    await expect(page.locator("#sidebar-account")).toBeVisible()

    await page.getByRole("button", { name: "Modo foco", exact: true }).click()

    await expect(page.locator("#sidebar-account")).toBeHidden()
    await expect(
      page.getByRole("textbox", { name: "Sua cena", exact: true })
    ).toBeVisible()

    await page.getByRole("button", { name: "Sair do modo foco" }).click()

    await expect(page.locator("#sidebar-account")).toBeVisible()
  })
})

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  )
}

for (const width of [320, 390]) {
  test.describe(`phone navigation at ${width}px`, () => {
    test.use({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
    })

    test("reaches every area and leaves the primary action uncovered", async ({
      page,
    }) => {
      const account = await signIn(page)
      await page.goto("/dashboard")

      const nav = page.getByRole("navigation", { name: "Navegação principal" })

      await expect(
        page.getByRole("button", { name: "Alternar menu" })
      ).toBeHidden()
      await expect(page.locator("#mobile-dashboard")).toHaveAttribute(
        "aria-current",
        "page"
      )
      await expect(page.locator("#mobile-themes")).toBeVisible()
      await expect(page.locator("#mobile-texts")).toBeVisible()
      await expect(page.locator("#mobile-account")).toBeVisible()

      const browse = page.locator("#dashboard-browse-themes")
      await expect(browse).toBeVisible()
      const browseBox = await browse.boundingBox()
      const navBox = await nav.boundingBox()
      expect(browseBox).not.toBeNull()
      expect(navBox).not.toBeNull()
      expect(boxesOverlap(browseBox!, navBox!)).toBe(false)

      await page.locator("#mobile-themes").tap()
      await expect(page).toHaveURL("/dashboard/themes")
      await expect(page.locator("#mobile-themes")).toHaveAttribute(
        "aria-current",
        "page"
      )
      await expect(
        page.getByRole("heading", { name: "Exercícios" })
      ).toBeVisible()

      await page.locator("#mobile-texts").tap()
      await expect(page).toHaveURL("/dashboard/texts")
      await expect(page.locator("#mobile-texts")).toHaveAttribute(
        "aria-current",
        "page"
      )
      await expect(
        page.getByRole("heading", { name: "Minhas cenas" })
      ).toBeVisible()

      await page.locator("#mobile-account").tap()
      await expect(page).toHaveURL("/dashboard/account")
      await expect(page.locator("#mobile-account")).toHaveAttribute(
        "aria-current",
        "page"
      )
      await expect(page.locator("#account-name")).toHaveText(account.name)
      await expect(page.locator("#account-email")).toHaveText(account.email)

      await page.goto("/dashboard/exercises/theme_key_on_the_table/write")
      const submit = page.getByRole("button", {
        name: "Enviar para leitura",
        exact: true,
      })
      await submit.scrollIntoViewIfNeeded()
      const submitBox = await submit.boundingBox()
      const bar = await page.locator("[data-app-navigation]").boundingBox()
      expect(submitBox).not.toBeNull()
      expect(bar).not.toBeNull()
      expect(boxesOverlap(submitBox!, bar!)).toBe(false)
      expect(submitBox!.x).toBeGreaterThanOrEqual(0)
      expect(submitBox!.x + submitBox!.width).toBeLessThanOrEqual(width)

      await page.getByRole("button", { name: "Modo foco", exact: true }).click()
      await expect(page.locator("[data-app-navigation]")).toBeHidden()
      await expect(
        page.getByRole("textbox", { name: "Sua cena", exact: true })
      ).toBeVisible()
      await page.getByRole("button", { name: "Sair do modo foco" }).click()
      await expect(page.locator("#mobile-account")).toBeVisible()
    })
  })
}
