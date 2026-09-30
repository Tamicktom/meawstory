//* Libraries imports
import { test as base, expect, type PlaywrightTestArgs } from "@playwright/test"

type GalleryMountParams = {
  story: string
  props?: Record<string, unknown>
}

export const test = base.extend({
  mount: async ({ page }, use) => {
    await page.goto("")

    async function renderStory(params: GalleryMountParams) {
      await page.evaluate(async (mountParams) => {
        await window.mount(mountParams)
      }, params)
    }

    const mountStory: PlaywrightTestArgs["mount"] = async (storyId, props) => {
      await renderStory({
        story: storyId,
        props: props as Record<string, unknown> | undefined,
      })

      const component = page.locator("#root")

      return Object.assign(component, {
        update: async (nextProps?: unknown) => {
          await renderStory({
            story: storyId,
            props: nextProps as Record<string, unknown> | undefined,
          })
        },
        unmount: async () => {
          await page.evaluate(async () => {
            await window.unmount()
            delete document.documentElement.dataset.navigatedTo
          })
        },
      })
    }

    await use(mountStory)

    await page.evaluate(async () => {
      await window.unmount()
      delete document.documentElement.dataset.navigatedTo
    })
  },
})

export { expect }
