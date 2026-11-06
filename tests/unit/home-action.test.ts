import { describe, expect, test } from "bun:test"
import { homeAction, sceneHref } from "@/lib/home-action"
import type { OwnedTextListItem } from "@/services/text"

function scene(overrides: Partial<OwnedTextListItem> = {}): OwnedTextListItem {
  return {
    id: "scene",
    themeId: "theme",
    themeTitle: "Exercício",
    title: "Cena",
    content: "texto",
    createdAt: new Date(0),
    lastActivityAt: new Date(0),
    genre: "action",
    closed: false,
    versionCount: 0,
    situation: "draft",
    band: null,
    label: "Rascunho salvo",
    unopened: false,
    correction: null,
    revisionFocus: null,
    ...overrides,
  }
}

describe("home action", () => {
  test("prioritizes every state independently of input order and recency", () => {
    const ordered = [
      scene({ id: "new", unopened: true, situation: "ready" }),
      scene({ id: "failed", situation: "failed" }),
      scene({ id: "waiting", situation: "waiting" }),
      scene({ id: "draft" }),
      scene({
        id: "focus",
        situation: "ready",
        revisionFocus: "Encurtar o diálogo",
      }),
    ]
    for (let i = 0; i < ordered.length; i++) {
      expect(homeAction(ordered.slice(i).reverse()).scene?.id).toBe(
        ordered[i].id
      )
    }
  })
  test("breaks ties by activity then id", () => {
    expect(homeAction([scene({ id: "b" }), scene({ id: "a" })]).scene?.id).toBe(
      "a"
    )
    expect(
      homeAction([
        scene({ id: "a" }),
        scene({ id: "b", lastActivityAt: new Date(1) }),
      ]).scene?.id
    ).toBe("b")
  })
  test("empty and closed history lead to catalog", () => {
    expect(homeAction([]).href).toBe("/dashboard/themes")
    expect(homeAction([scene({ closed: true })]).scene).toBeNull()
  })
  test("unopened closed reading can still be opened", () => {
    expect(homeAction([scene({ closed: true, unopened: true })]).href).toBe(
      "/dashboard/texts/scene"
    )
  })
  test("draft and revision resume writing; readings open detail", () => {
    expect(sceneHref(scene())).toBe(
      "/dashboard/exercises/theme/write?textId=scene"
    )
    expect(sceneHref(scene({ situation: "failed" }))).toBe(
      "/dashboard/texts/scene"
    )
    expect(
      homeAction([scene({ situation: "ready", revisionFocus: "Foco" })]).href
    ).toContain("/write?textId=scene")
  })
})
