//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import {
  sceneMatchesFilter,
  sceneStatus,
  versionCountLabel,
  type SceneAttempt,
} from "@/lib/scene-status"

function attempt(
  status: SceneAttempt["status"],
  score: string,
  textContent = "Cena congelada.",
  openedAt: Date | null = null
): SceneAttempt {
  return { status, score, textContent, openedAt }
}

describe("sceneStatus", () => {
  it("keeps a scene without a reading as one saved draft", () => {
    expect(
      sceneStatus({ closed: false, content: "Rascunho.", attempts: [] })
    ).toEqual({
      situation: "draft",
      band: null,
      label: "Rascunho salvo",
      versionCount: 0,
      unopened: false,
    })
  })

  it("names the band of a finished reading and counts it as new until it is opened", () => {
    expect(
      sceneStatus({
        closed: false,
        content: "Cena congelada.",
        attempts: [attempt("COMPLETED", "640.00")],
      })
    ).toMatchObject({
      situation: "ready",
      band: "working",
      label: "Funciona",
      versionCount: 1,
      unopened: true,
    })
  })

  it("stops calling a reading new after its first opening", () => {
    const status = sceneStatus({
      closed: false,
      content: "Cena congelada.",
      attempts: [attempt("COMPLETED", "640.00", "Cena congelada.", new Date())],
    })

    expect(status.unopened).toBe(false)
  })

  it("treats a low score as a band, not as giving up", () => {
    expect(
      sceneStatus({
        closed: false,
        content: "Cena congelada.",
        attempts: [attempt("COMPLETED", "10.00")],
      }).label
    ).toBe("Ausente")
  })

  it("counts only completed readings as versions and keeps failed attempts off the list", () => {
    const status = sceneStatus({
      closed: false,
      content: "Cena congelada.",
      attempts: [
        attempt("FAILED", "0.00"),
        attempt(
          "COMPLETED",
          "900.00",
          "Cena congelada.",
          new Date("2024-01-01")
        ),
      ],
    })

    expect(status).toMatchObject({
      situation: "failed",
      label: "Leitura com falha",
      versionCount: 1,
      unopened: false,
    })
    expect(versionCountLabel(status.versionCount)).toBe("1 versão")
  })

  it("calls a changed draft after a reading a revision", () => {
    expect(
      sceneStatus({
        closed: false,
        content: "Cena congelada.\n\nEla atravessou.",
        attempts: [attempt("COMPLETED", "801.00")],
      })
    ).toMatchObject({
      situation: "revising",
      band: "strong",
      label: "Em revisão",
      versionCount: 1,
    })
  })

  it("closes a scene at any band and keeps its versions", () => {
    const status = sceneStatus({
      closed: true,
      content: "Cena congelada.",
      attempts: [attempt("COMPLETED", "10.00"), attempt("COMPLETED", "200.00")],
    })

    expect(status).toMatchObject({
      situation: "closed",
      band: "missing",
      label: "Encerrada · Ausente",
      versionCount: 2,
    })
    expect(status.label).not.toContain("Desist")
  })

  it("matches genre filters and situation filters together by the current situation", () => {
    const ready = sceneStatus({
      closed: false,
      content: "Cena congelada.",
      attempts: [attempt("COMPLETED", "640.00")],
    })
    const closed = sceneStatus({
      closed: true,
      content: "Cena congelada.",
      attempts: [attempt("COMPLETED", "640.00")],
    })

    expect(sceneMatchesFilter(ready, "working")).toBe(true)
    expect(sceneMatchesFilter(ready, "closed")).toBe(false)
    expect(sceneMatchesFilter(closed, "working")).toBe(false)
    expect(sceneMatchesFilter(closed, "closed")).toBe(true)
    expect(sceneMatchesFilter(ready, "unknown")).toBe(false)
    expect(versionCountLabel(0)).toBe("Nenhuma versão")
    expect(versionCountLabel(3)).toBe("3 versões")
  })
})
