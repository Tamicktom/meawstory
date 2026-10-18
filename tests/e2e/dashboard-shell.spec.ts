//* Libraries imports
import { expect, test } from "@playwright/test"

//* Local imports
import { signIn } from "../helpers/sign-in"

test.describe("dashboard session gate", () => {
  test("shows Unauthorized and hides the shell when there is no session", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    await expect(
      page.getByRole("heading", { name: "Unauthorized" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Meawstory" })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Themes" })).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Toggle Sidebar" })
    ).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Browse themes" })).toHaveCount(
      0
    )
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0)
  })

  test("shows the sidebar, the trigger, and the page when the visitor is signed in", async ({
    page,
  }) => {
    await signIn(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("link", { name: "Meawstory" })).toBeVisible()
    await expect(page.locator("#sidebar-dashboard")).toBeVisible()
    await expect(page.locator("#sidebar-themes")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Toggle Sidebar" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible()
    await expect(page.getByText("Start by choosing a theme.")).toBeVisible()
    await expect(
      page.getByText("Write a text for it and receive a correction", {
        exact: false,
      })
    ).toBeVisible()
    await expect(page.getByText(/rubric/)).toBeVisible()
  })

  test("links Browse themes to the theme catalog", async ({ page }) => {
    await signIn(page)
    await page.goto("/dashboard")

    const browseThemes = page.locator("#dashboard-browse-themes")

    await expect(browseThemes).toHaveText("Browse themes")
    await expect(browseThemes).toHaveAttribute("href", "/dashboard/themes")

    await browseThemes.click()

    await expect(page).toHaveURL("/dashboard/themes")
    await expect(page.getByRole("heading", { name: "Themes" })).toBeVisible()
  })

  test("signs out and shows Unauthorized on the dashboard", async ({ page }) => {
    await signIn(page)
    await page.goto("/dashboard")

    const signOut = page.getByRole("button", { name: "Sign out" })

    await expect(signOut).toHaveAttribute("id", "sidebar-sign-out")
    await expect(signOut).toHaveAttribute("type", "button")

    await signOut.click()

    await expect(page).toHaveURL("/dashboard")
    await expect(
      page.getByRole("heading", { name: "Unauthorized" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Meawstory" })).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Toggle Sidebar" })
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

    await page.locator("#sidebar-dashboard").click()

    await expect(page).toHaveURL("/dashboard")
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible()
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
  })
})
