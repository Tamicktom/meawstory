//* Libraries imports
import { expect, test, type Page } from "@playwright/test"

const typingTargetIds = [
  "hotkey-input",
  "hotkey-textarea",
  "hotkey-select",
  "hotkey-editable",
] as const

function themeRoot(page: Page) {
  return page.locator("html")
}

async function expectTheme(page: Page, theme: "light" | "dark") {
  const other = theme === "light" ? "dark" : "light"

  await expect(themeRoot(page)).toHaveClass(new RegExp(`\\b${theme}\\b`))
  await expect(themeRoot(page)).not.toHaveClass(new RegExp(`\\b${other}\\b`))
}

async function openHome(page: Page, colorScheme: "light" | "dark") {
  await page.emulateMedia({ colorScheme })
  await page.goto("/")
  await expectTheme(page, colorScheme)
}

type KeyDispatch = {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  repeat?: boolean
}

async function dispatchKey(page: Page, init: KeyDispatch) {
  await page.evaluate((eventInit) => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: eventInit.key,
        altKey: eventInit.altKey,
        ctrlKey: eventInit.ctrlKey,
        metaKey: eventInit.metaKey,
        repeat: eventInit.repeat,
      })
    )
  }, init)
}

async function mountTypingTargets(page: Page) {
  await page.evaluate(() => {
    const host = document.createElement("div")

    host.innerHTML = `
      <input id="hotkey-input" />
      <textarea id="hotkey-textarea"></textarea>
      <select id="hotkey-select"><option>One</option></select>
      <div id="hotkey-editable" contenteditable="true">Edit</div>
    `

    document.body.append(host)
  })
}

test.describe("home page", () => {
  test("shows the project heading, the hello message, and the dark mode hint", async ({
    page,
  }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
    await expect(page.getByText("Hello World", { exact: true })).toBeVisible()
    await expect(page.getByText("(Press d to toggle dark mode)")).toBeVisible()
    await expect(page.locator("kbd")).toHaveText("d")
  })
})

test.describe("dark mode hotkey", () => {
  test("uses light when the system preference is light", async ({ page }) => {
    await openHome(page, "light")
  })

  test("uses dark when the system preference is dark", async ({ page }) => {
    await openHome(page, "dark")
  })

  test("switches from light to dark and back when d is pressed", async ({
    page,
  }) => {
    await openHome(page, "light")

    await page.keyboard.press("d")
    await expectTheme(page, "dark")

    await page.keyboard.press("d")
    await expectTheme(page, "light")
  })

  test("switches from dark to light when d is pressed", async ({ page }) => {
    await openHome(page, "dark")

    await page.keyboard.press("d")
    await expectTheme(page, "light")
  })

  test("ignores d while focus is in an input, textarea, select, or contenteditable element", async ({
    page,
  }) => {
    await openHome(page, "light")
    await mountTypingTargets(page)

    for (const id of typingTargetIds) {
      await page.locator(`#${id}`).focus()
      await page.keyboard.press("d")
      await expectTheme(page, "light")
    }

    await page.locator("h1").click()
    await page.keyboard.press("d")
    await expectTheme(page, "dark")
  })

  test("ignores d when Ctrl, Meta, or Alt is held", async ({ page }) => {
    await openHome(page, "light")

    await dispatchKey(page, { key: "d", ctrlKey: true })
    await expectTheme(page, "light")

    await dispatchKey(page, { key: "d", metaKey: true })
    await expectTheme(page, "light")

    await dispatchKey(page, { key: "d", altKey: true })
    await expectTheme(page, "light")

    await page.keyboard.press("d")
    await expectTheme(page, "dark")
  })

  test("ignores a repeated d key event", async ({ page }) => {
    await openHome(page, "light")

    await dispatchKey(page, { key: "d", repeat: true })
    await expectTheme(page, "light")

    await page.keyboard.press("d")
    await expectTheme(page, "dark")
  })
})
