//* Libraries imports
import { expect, type Page } from "@playwright/test"

const previousUserQueryKey = ["previous-user"]
const previousUserQueryData = "previous-user-data"
const authDocumentMarker = "auth-cache"

type CachedQuery = {
  queryKey: unknown[]
  data: unknown
}

type AuthPageState = {
  marker: string | null
  queries: CachedQuery[]
}

const previousUserQuery: CachedQuery = {
  queryKey: previousUserQueryKey,
  data: previousUserQueryData,
}

async function installQueryCacheProbe(page: Page) {
  await page.addInitScript(() => {
    type ReactFiber = {
      return: ReactFiber | null
      memoizedProps?: { value?: unknown } | null
      pendingProps?: { value?: unknown } | null
    }

    type QueryClientLike = {
      clear: () => void
      setQueryData: (queryKey: readonly unknown[], data: unknown) => unknown
      getQueryCache: () => {
        getAll: () => Array<{
          queryKey: readonly unknown[]
          state: { data: unknown }
        }>
      }
    }

    function isQueryClient(value: unknown): value is QueryClientLike {
      if (typeof value !== "object" || value === null) {
        return false
      }

      const candidate = value as {
        clear?: unknown
        getQueryCache?: unknown
        setQueryData?: unknown
      }

      return (
        typeof candidate.clear === "function" &&
        typeof candidate.getQueryCache === "function" &&
        typeof candidate.setQueryData === "function"
      )
    }

    function reactFiber(node: Node): ReactFiber | null {
      const key = Object.getOwnPropertyNames(node).find(
        (name) =>
          name.startsWith("__reactFiber$") ||
          name.startsWith("__reactContainer$")
      )

      if (!key) {
        return null
      }

      return (
        (node as Node & Record<string, ReactFiber | undefined>)[key] ?? null
      )
    }

    function findQueryClient(): QueryClientLike {
      const seen = new Set<ReactFiber>()
      const nodes: Node[] = [
        document.documentElement,
        ...document.querySelectorAll("*"),
      ]

      for (const node of nodes) {
        let fiber = reactFiber(node)

        while (fiber && !seen.has(fiber)) {
          seen.add(fiber)

          for (const props of [fiber.memoizedProps, fiber.pendingProps]) {
            const value = props?.value

            if (isQueryClient(value)) {
              return value
            }
          }

          fiber = fiber.return
        }
      }

      throw new Error("Query client was not found")
    }

    ;(
      window as Window & {
        __meawstoryFindQueryClient?: () => QueryClientLike
      }
    ).__meawstoryFindQueryClient = findQueryClient
  })
}

async function writePreviousUserQuery(page: Page) {
  return page.evaluate(
    ({ queryKey, data, marker }) => {
      const browserWindow = window as Window & {
        __meawstoryDocument?: string
        __meawstoryFindQueryClient?: () => {
          setQueryData: (queryKey: readonly unknown[], data: unknown) => unknown
        }
      }
      const findQueryClient = browserWindow.__meawstoryFindQueryClient

      if (!findQueryClient) {
        return "Query cache probe was not installed"
      }

      try {
        findQueryClient().setQueryData(queryKey, data)
        browserWindow.__meawstoryDocument = marker
        return "seeded"
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Could not seed the query cache"
      }
    },
    {
      queryKey: previousUserQueryKey,
      data: previousUserQueryData,
      marker: authDocumentMarker,
    }
  )
}

async function readAuthPageState(page: Page): Promise<AuthPageState> {
  return page.evaluate(() => {
    const browserWindow = window as Window & {
      __meawstoryDocument?: string
      __meawstoryFindQueryClient?: () => {
        getQueryCache: () => {
          getAll: () => Array<{
            queryKey: readonly unknown[]
            state: { data: unknown }
          }>
        }
      }
    }
    const findQueryClient = browserWindow.__meawstoryFindQueryClient

    if (!findQueryClient) {
      throw new Error("Query cache probe was not installed")
    }

    const queries = findQueryClient()
      .getQueryCache()
      .getAll()
      .map((query) => ({
        queryKey: [...query.queryKey],
        data: query.state.data,
      }))

    return {
      marker: browserWindow.__meawstoryDocument ?? null,
      queries,
    }
  })
}

async function seedPreviousUserQuery(page: Page) {
  await expect.poll(() => writePreviousUserQuery(page)).toBe("seeded")
  await expect(readAuthPageState(page)).resolves.toEqual({
    marker: authDocumentMarker,
    queries: [previousUserQuery],
  })
}

async function expectCachedQueriesCleared(page: Page) {
  await expect
    .poll(() => readAuthPageState(page))
    .toEqual({
      marker: authDocumentMarker,
      queries: [],
    })
}

export {
  expectCachedQueriesCleared,
  installQueryCacheProbe,
  seedPreviousUserQuery,
}
