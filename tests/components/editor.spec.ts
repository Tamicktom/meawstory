//* Libraries imports
import { type Locator, type Page, type Route } from "@playwright/test"

//* Local imports
import { expect, test } from "../../playwright/component"

const story = "components/write/editor/Default"
const starterText = "Hello World! 🌎️"
const plainText = "A sentence with a scene."
const preparingCopy = "A correção está sendo preparada."
const errorCopy = "Erro ao enviar texto"
const statusIntervalMs = 3_000

type Mount = (
  storyId: string,
  props?: { themeId: string }
) => Promise<Locator>

function themeId() {
  return `theme-${crypto.randomUUID()}`
}

function textId() {
  return `text-${crypto.randomUUID()}`
}

function writeRoute(id: string) {
  return `**/api/write/${id}`
}

function statusRoute(id: string) {
  return `**/api/correction/check-correction-status/${id}`
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

async function mountEditor(mount: Mount, id: string) {
  const component = await mount(story, { themeId: id })

  await expect(component.getByText(starterText)).toBeVisible()

  return component
}

function submitButton(component: Locator) {
  return component.locator("#submit-text")
}

async function replaceEditorText(page: Page, component: Locator, content: string) {
  const surface = component.locator(".ProseMirror")

  await surface.click()
  await page.keyboard.press("ControlOrMeta+A")
  await page.keyboard.insertText(content)
}

async function navigatedPath(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.navigatedTo ?? "")
}

test.describe("Editor", () => {
  test("starts with the TipTap starter content", async ({ mount }) => {
    const component = await mountEditor(mount, themeId())
    const button = submitButton(component)

    await expect(button).toHaveAttribute("type", "button")
    await expect(button).toHaveText("Enviar texto")
    await expect(component.getByText(starterText)).toBeVisible()
  })

  test("posts the editor plain text to the write route", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    let posted: { pathname: string; content: string } | undefined

    await page.route(writeRoute(id), async (route) => {
      const body = route.request().postDataJSON() as { content?: string }

      posted = {
        pathname: new URL(route.request().url()).pathname,
        content: body.content ?? "",
      }
      await fulfillJson(route, 200, {})
    })

    const component = await mountEditor(mount, id)

    await replaceEditorText(page, component, plainText)
    await submitButton(component).click()
    await expect.poll(() => posted?.pathname).toBe(`/api/write/${id}`)
    expect(posted?.content.replace(/\s+/g, " ").trim()).toBe(plainText)
    expect(posted?.content).not.toContain("<")
  })

  test("keeps the button disabled while the request is in flight", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })

    await page.route(writeRoute(id), async (route) => {
      await pending
      await fulfillJson(route, 200, {})
    })

    const component = await mountEditor(mount, id)
    const button = submitButton(component)

    await button.click()
    await expect(button).toBeDisabled()

    release()

    await expect(button).toBeEnabled()
    await expect(component.getByText(preparingCopy)).toHaveCount(0)
  })

  test("shows that the correction is being prepared and keeps the button disabled", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    const createdTextId = textId()

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 200, { textId: createdTextId })
    })
    await page.route(statusRoute(createdTextId), async (route) => {
      await fulfillJson(route, 200, { status: "PENDING" })
    })

    const component = await mountEditor(mount, id)
    const button = submitButton(component)

    await button.click()

    await expect(component.getByText(preparingCopy)).toBeVisible()
    await expect(button).toBeDisabled()
    await expect.poll(() => navigatedPath(page)).toBe("")
  })

  test("checks the correction status every 3 seconds while a text id is set", async ({
    mount,
    page,
  }) => {
    test.setTimeout(20_000)

    const id = themeId()
    const createdTextId = textId()
    const requestedAt: number[] = []

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 200, { textId: createdTextId })
    })
    await page.route(statusRoute(createdTextId), async (route) => {
      requestedAt.push(Date.now())
      await fulfillJson(route, 200, { status: "PENDING" })
    })

    const component = await mountEditor(mount, id)

    await submitButton(component).click()
    await expect.poll(() => requestedAt.length).toBe(1)

    await expect
      .poll(() => requestedAt.length, { timeout: statusIntervalMs + 2_000 })
      .toBe(2)
    await expect
      .poll(() => requestedAt.length, { timeout: statusIntervalMs + 2_000 })
      .toBe(3)

    const firstGap = requestedAt[1]! - requestedAt[0]!
    const secondGap = requestedAt[2]! - requestedAt[1]!

    expect(firstGap).toBeGreaterThanOrEqual(statusIntervalMs - 500)
    expect(firstGap).toBeLessThan(statusIntervalMs + 1_500)
    expect(secondGap).toBeGreaterThanOrEqual(statusIntervalMs - 500)
    expect(secondGap).toBeLessThan(statusIntervalMs + 1_500)
  })

  test("opens the text page when the correction is completed", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    const createdTextId = textId()

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 200, { textId: createdTextId })
    })
    await page.route(statusRoute(createdTextId), async (route) => {
      await fulfillJson(route, 200, { status: "COMPLETED" })
    })

    const component = await mountEditor(mount, id)

    await submitButton(component).click()

    await expect
      .poll(() => navigatedPath(page))
      .toBe(`/dashboard/texts/${createdTextId}`)
    await expect(component.getByText(preparingCopy)).toHaveCount(0)
    await expect(submitButton(component)).toBeEnabled()
  })

  test("stays on the editor when the write response has no text id", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    const statusRequests: string[] = []

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 200, { message: "ok" })
    })
    await page.route("**/api/correction/check-correction-status/**", async (route) => {
      statusRequests.push(route.request().url())
      await fulfillJson(route, 200, { status: "COMPLETED" })
    })

    const component = await mountEditor(mount, id)
    const button = submitButton(component)

    await button.click()
    await expect(button).toBeEnabled()
    await expect(component.getByText(preparingCopy)).toHaveCount(0)
    await expect(component.getByText(errorCopy)).toHaveCount(0)
    await expect.poll(() => navigatedPath(page)).toBe("")
    expect(statusRequests).toEqual([])
  })

  test("shows an error and enables the button when the write request fails", async ({
    mount,
    page,
  }) => {
    const id = themeId()

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 500, { message: "nope" })
    })

    const component = await mountEditor(mount, id)
    const button = submitButton(component)

    await button.click()

    await expect(component.getByText(errorCopy, { exact: true })).toBeVisible()
    await expect(button).toBeEnabled()
    await expect(component.getByText(preparingCopy)).toHaveCount(0)
    await expect.poll(() => navigatedPath(page)).toBe("")
  })

  test("stops waiting and shows an error when the correction fails", async ({
    mount,
    page,
  }) => {
    const id = themeId()
    const createdTextId = textId()

    await page.route(writeRoute(id), async (route) => {
      await fulfillJson(route, 200, { textId: createdTextId })
    })
    await page.route(statusRoute(createdTextId), async (route) => {
      await fulfillJson(route, 200, { status: "FAILED" })
    })

    const component = await mountEditor(mount, id)
    const button = submitButton(component)

    await button.click()

    await expect(component.getByText(errorCopy, { exact: true })).toBeVisible()
    await expect(component.getByText(preparingCopy)).toHaveCount(0)
    await expect(button).toBeEnabled()
    await expect.poll(() => navigatedPath(page)).toBe("")
  })

  test("does not check correction status before a text id exists", async ({
    mount,
    page,
  }) => {
    test.setTimeout(15_000)

    const statusRequests: string[] = []

    await page.route(
      "**/api/correction/check-correction-status/**",
      async (route) => {
        statusRequests.push(route.request().url())
        await fulfillJson(route, 200, { status: "PENDING" })
      }
    )

    await mountEditor(mount, themeId())
    await page.waitForTimeout(statusIntervalMs + 500)

    expect(statusRequests).toEqual([])
  })
})
