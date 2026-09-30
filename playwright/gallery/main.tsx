/// <reference types="vite/client" />

//* Libraries imports
import { type ComponentType } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"

//* Components imports
import { QueryProvider } from "@/components/providers/query-provider"

//* Styles imports
import "../../app/globals.css"

type StoryModule = Record<
  string,
  ComponentType<Record<string, unknown>> | undefined
>

type MountParams = {
  story: string
  props?: Record<string, unknown>
}

declare global {
  interface Window {
    mount: (params: MountParams) => Promise<void>
    unmount: () => Promise<void>
  }
}

const stories = import.meta.glob("../../components/**/*.story.tsx") as Record<
  string,
  () => Promise<StoryModule>
>

function storyPath(file: string) {
  return file.replace(/^(\.\.\/)+/, "").replace(/\.story\.\w+$/, "")
}

async function resolveStory(storyId: string) {
  const separator = storyId.lastIndexOf("/")
  const path = storyId.slice(0, separator)
  const name = storyId.slice(separator + 1)
  const file = Object.keys(stories).find((candidate) => {
    const candidatePath = storyPath(candidate)

    return candidatePath === path || candidatePath.endsWith(`/${path}`)
  })

  if (!file) {
    return undefined
  }

  const storyModule = await stories[file]()

  return storyModule[name] ?? storyModule.default
}

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Gallery root element was not found.")
}

let root: Root | undefined

window.mount = async (params: MountParams) => {
  const Story = await resolveStory(params.story)

  if (!Story) {
    throw new Error(`Unknown story: ${params.story}`)
  }

  root ??= createRoot(rootElement)

  flushSync(() => {
    root?.render(
      <QueryProvider>
        <Story {...params.props} />
      </QueryProvider>
    )
  })
}

window.unmount = async () => {
  root?.unmount()
  root = undefined
}
