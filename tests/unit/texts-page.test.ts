//* Libraries imports
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { eq } from "drizzle-orm"
import * as nextHeaders from "next/headers"
import * as navigation from "next/navigation"
import { renderToStaticMarkup } from "react-dom/server"

//* Local imports
import TextsPage from "@/app/(app)/dashboard/texts/page"
import { db } from "@/database"
import { correction, rubric, text, theme } from "@/database/schema"
import { openSession } from "@/tests/helpers/open-session"
import {
  actionCriteria,
  createIsolatedRows,
} from "@/tests/helpers/schema-fixtures"

const rows = createIsolatedRows()
const headerBox = {
  current: new Headers(),
}
const sessions: Array<{ close: () => Promise<void> }> = []

let restoreHeaders = () => {}

beforeEach(() => {
  headerBox.current = new Headers()

  const headersSpy = spyOn(nextHeaders, "headers").mockImplementation(
    async () => headerBox.current as never
  )
  const routerSpy = spyOn(navigation, "useRouter").mockReturnValue({
    push() {},
    refresh() {},
  } as never)

  restoreHeaders = () => {
    headersSpy.mockRestore()
    routerSpy.mockRestore()
  }
})

afterEach(async () => {
  restoreHeaders()

  for (const session of sessions) {
    await session.close()
  }

  sessions.length = 0
  await rows.cleanup()
})

async function signIn() {
  const session = await openSession()
  sessions.push(session)
  headerBox.current = session.headers
  return session
}

async function loadPage(searchParams?: { genero?: string; situacao?: string }) {
  return renderToStaticMarkup(
    await TextsPage({
      searchParams: Promise.resolve(searchParams ?? {}),
    })
  )
}

async function expectRedirectToSignIn() {
  let thrown: unknown

  try {
    await TextsPage()
  } catch (error) {
    thrown = error
  }

  expect((thrown as { digest?: string }).digest).toContain("/sign-in")
}

describe("TextsPage", () => {
  it("redirects to sign in when there is no session", async () => {
    await rows.insertActiveText()

    await expectRedirectToSignIn()
  })

  it("shows an empty history with a link to the themes", async () => {
    await signIn()

    const markup = await loadPage()

    expect(markup).toContain("Minhas cenas")
    expect(markup).toContain("Você ainda não tem cenas.")
    expect(markup).toContain('id="texts-browse-themes"')
    expect(markup).toContain('href="/dashboard/themes"')
  })

  it("lists the signed-in user's texts newest first and leaves out other writers", async () => {
    const session = await signIn()
    const older = await rows.insertActiveText({
      content: "The older draft stays on the desk.",
      themeTitle: "Older theme",
    })
    const newerThemeId = await rows.insertTheme(older.rubricId, {
      title: "Newer theme",
    })
    const newerId = await rows.insertText({
      userId: session.userId,
      themeId: newerThemeId,
      content: "The newer draft names the missing key.",
    })
    await rows.insertText({
      userId: older.userId,
      themeId: older.themeId,
      content: "This draft belongs to someone else.",
    })

    await db
      .update(text)
      .set({
        userId: session.userId,
        createdAt: new Date("2020-01-01T00:00:00.000Z"),
        updatedAt: new Date("2020-01-02T00:00:00.000Z"),
      })
      .where(eq(text.id, older.textId))
    await db
      .update(text)
      .set({
        createdAt: new Date("2024-06-01T00:00:00.000Z"),
        updatedAt: new Date("2024-06-01T00:00:00.000Z"),
      })
      .where(eq(text.id, newerId))

    await rows.insertCorrection({
      textId: newerId,
      rubricId: older.rubricId,
      score: "640.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-02T00:00:00.000Z"),
    })

    const markup = await loadPage()
    const newerIndex = markup.indexOf(`href="/dashboard/texts/${newerId}"`)
    const olderIndex = markup.indexOf(`Text ${older.textId}`)

    expect(newerIndex).toBeGreaterThan(-1)
    expect(olderIndex).toBeGreaterThan(newerIndex)
    const newerCard = markup.slice(newerIndex, olderIndex)
    expect(newerCard).toContain("Exercício: Newer theme")
    expect(newerCard).toContain("1 versão")
    expect(newerCard).toContain('dateTime="2024-06-02T00:00:00.000Z"')
    expect(newerCard).toContain("1 de jun. de 2024")
    expect(newerCard).toContain("Funciona")
    expect(newerCard).toContain("Nova")
    expect(markup.slice(olderIndex)).toContain("Nenhuma versão")
    expect(markup.slice(olderIndex)).toContain("Rascunho salvo")
    expect(markup).not.toContain("The newer draft names the missing key.")
    expect(markup).not.toContain("This draft belongs to someone else.")
    expect(markup).not.toContain("Você ainda não tem cenas.")
    expect(markup).toContain(`id="delete-scene-${newerId}"`)
    expect(markup).toContain(`id="delete-scene-${older.textId}"`)
  })

  it("hides the placeholder score while a correction is still running", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "A letter that arrives late",
    })

    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "IN_PROGRESS",
    })

    const markup = await loadPage()

    expect(markup).toContain("Leitura em andamento")
    expect(markup).not.toContain("/ 1000")
  })

  it("says the correction failed when the latest attempt failed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "A letter that arrives late",
    })

    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "FAILED",
    })

    const markup = await loadPage()

    expect(markup).toContain("Leitura com falha")
    expect(markup).not.toContain("/ 1000")
  })

  it("offers undo for a scene retired a moment ago and hides its text", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      content: "A retired draft should leave the list.",
      themeTitle: "Retired theme",
    })

    await db
      .update(text)
      .set({
        userId: session.userId,
        deletedAt: new Date(),
      })
      .where(eq(text.id, graph.textId))

    const markup = await loadPage()

    expect(markup).toContain("Cena excluída.")
    expect(markup).toContain(`Text ${graph.textId}`)
    expect(markup).toContain(`id="undo-delete-scene-${graph.textId}"`)
    expect(markup).not.toContain("A retired draft should leave the list.")
    expect(markup).not.toContain("Você ainda não tem cenas.")
  })

  it("says an in-progress reading will not finish while the scene stays deleted", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "Scene still being read",
    })

    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      status: "PENDING",
    })
    await db
      .update(text)
      .set({ deletedAt: new Date() })
      .where(eq(text.id, graph.textId))

    const markup = await loadPage()

    expect(markup).toContain("Cena excluída.")
    expect(markup).toContain("A leitura em andamento não será concluída.")
  })

  it("leaves out a scene whose undo window has already closed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      content: "This retirement is already final.",
      themeTitle: "Closed window",
    })

    await db
      .update(text)
      .set({
        userId: session.userId,
        deletedAt: new Date(Date.now() - 60_000),
      })
      .where(eq(text.id, graph.textId))

    const markup = await loadPage()

    expect(markup).not.toContain("Cena excluída.")
    expect(markup).not.toContain("This retirement is already final.")
    expect(markup).toContain("Você ainda não tem cenas.")
  })

  it("filters by genre and situation without duplicating a failed attempt", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({
      themeTitle: "A letter that arrives late",
    })
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    await db
      .update(rubric)
      .set({ genre: "romance", criteria: actionCriteria })
      .where(eq(rubric.id, graph.rubricId))
    await db
      .update(theme)
      .set({
        genre: "romance",
        objective: "Treinar um encontro entre duas pessoas adultas.",
        minWords: 100,
        maxWords: 400,
        briefing: {
          situation: "Dois adultos se encontram no fim do dia.",
          alreadyTrue: ["Eles já se conhecem."],
          mustInclude: ["Uma escolha visível."],
          youDecide: "Como a cena termina.",
          doNotPenalize: ["Um final aberto."],
        },
      })
      .where(eq(theme.id, graph.themeId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "900.00",
      status: "COMPLETED",
      createdAt: new Date("2024-06-01T00:00:00.000Z"),
    })
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "0.00",
      status: "FAILED",
      createdAt: new Date(),
    })

    const markup = await loadPage({ genero: "romance", situacao: "failed" })
    const hidden = await loadPage({ genero: "action", situacao: "failed" })

    const card = markup.slice(
      markup.indexOf(`href="/dashboard/texts/${graph.textId}"`)
    )
    expect(card.match(/Leitura com falha/g)).toHaveLength(1)
    expect(card).toContain("Gênero: Romance")
    expect(card).toContain("1 versão")
    expect(card).not.toContain("Forte")
    expect(markup.match(/<li /g)).toHaveLength(1)
    expect(hidden).toContain("Nenhuma cena corresponde a esses filtros.")
    expect(hidden).toContain('id="scenes-clear-filters-empty"')
  })

  it("shows a closed scene as closed at a low band and offers reopening", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText({ themeTitle: "Low band" })
    await db
      .update(text)
      .set({ userId: session.userId, closedAt: new Date() })
      .where(eq(text.id, graph.textId))
    await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "10.00",
      status: "COMPLETED",
    })

    const markup = await loadPage()

    expect(markup).toContain("Encerrada · Ausente")
    expect(markup).not.toContain("Desist")
    expect(markup).toContain(`id="reopen-scene-${graph.textId}"`)
    expect(markup).toContain(`id="delete-scene-${graph.textId}"`)
  })

  it("leaves a ready reading unopened when the scene is only listed", async () => {
    const session = await signIn()
    const graph = await rows.insertActiveText()
    await db
      .update(text)
      .set({ userId: session.userId })
      .where(eq(text.id, graph.textId))
    const correctionId = await rows.insertCorrection({
      textId: graph.textId,
      rubricId: graph.rubricId,
      score: "640.00",
      status: "COMPLETED",
    })

    await loadPage()

    const [stored] = await db
      .select({ openedAt: correction.openedAt, score: correction.score })
      .from(correction)
      .where(eq(correction.id, correctionId))
    expect(stored?.openedAt).toBeNull()
    expect(stored?.score).toBe("640.00")
  })
})
