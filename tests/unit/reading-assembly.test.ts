//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { rubricSeeds } from "@/database/seed/catalog"
import { assembleReading, type ReadingDraft } from "@/lib/reading-assembly"
import { bandForCriterionScore } from "@/lib/reading-contract"
import { renderReadingMarkdown } from "@/lib/reading-markdown"
import { locateQuote } from "@/lib/reading-quotes"

const criteria = rubricSeeds.find(
  (item) => item.id === "rubric_fight"
)!.criteria
const scene = [
  "Rogério empurrou Elisa contra a bancada.",
  "",
  "— Você não vai sair daqui — disse ele.",
  "",
  "Ela pegou uma panela e ameaçou ele.   Ele parou.",
].join("\n")

function draft(
  overrides: Partial<ReadingDraft> = {},
  scores = [60, 80, 80, 100, 80]
): ReadingDraft {
  return {
    criteria: criteria.map((criterion, index) => ({
      id: criterion.id,
      score: scores[index],
      strengths: "Há um objeto.",
      gaps: "Os golpes não deixam rastro.",
      evidence: ["Ela pegou uma panela e ameaçou ele"],
    })),
    highlight: {
      description: "A panela muda a luta.",
      evidence: "Ela pegou uma panela",
    },
    opening: "A cena tem uma briga na cozinha. Ela começa e para.",
    revision: "Faça o empurrão contra a bancada custar algo depois.",
    ...overrides,
  }
}

describe("locateQuote", () => {
  it("returns the scene's own characters for a literal quote", () => {
    expect(locateQuote("Rogério empurrou Elisa contra a bancada.", scene)).toBe(
      "Rogério empurrou Elisa contra a bancada"
    )
  })

  it("tolerates quotation marks, case, dashes and whitespace", () => {
    expect(locateQuote("“- você não vai sair daqui - disse ele”", scene)).toBe(
      "Você não vai sair daqui — disse ele"
    )
    expect(locateQuote("ameaçou ele. Ele parou", scene)).toBe(
      "ameaçou ele.   Ele parou"
    )
  })

  it("rejects paraphrase, omissions, missing accents and quotes under three words", () => {
    expect(
      locateQuote("Rogério empurrou Elisa contra a parede", scene)
    ).toBeNull()
    expect(locateQuote("Rogério empurrou ... a bancada", scene)).toBeNull()
    expect(locateQuote("Rogerio empurrou Elisa", scene)).toBeNull()
    expect(locateQuote("Ele parou", scene)).toBeNull()
  })
})

describe("bandForCriterionScore", () => {
  it("puts hundredths past a band ceiling in the next band", () => {
    const fidelity = criteria[0]
    expect(bandForCriterionScore(0, fidelity)).toBe("missing")
    expect(bandForCriterionScore(30, fidelity)).toBe("missing")
    expect(bandForCriterionScore(30.01, fidelity)).toBe("thin")
    expect(bandForCriterionScore(121, fidelity)).toBe("strong")
    expect(bandForCriterionScore(150, fidelity)).toBe("strong")
  })
})

describe("assembleReading", () => {
  it("sums the total and computes every band on the server, in rubric order", () => {
    const reversed = draft()
    reversed.criteria.reverse()
    const result = assembleReading(reversed, criteria, scene)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.score).toBe("400.00")
    expect(result.reading.criteria.map((entry) => entry.id)).toEqual(
      criteria.map((c) => c.id)
    )
    expect(result.reading.criteria.map((entry) => entry.band)).toEqual([
      "thin",
      "thin",
      "thin",
      "thin",
      "thin",
    ])
  })

  it("rounds criterion scores to hundredths before summing", () => {
    const result = assembleReading(
      draft({}, [60.004, 80.006, 80, 100, 80]),
      criteria,
      scene
    )

    expect(result.ok && result.score).toBe("400.01")
  })

  it("rejects a reply that misses, repeats or invents a criterion", () => {
    const missing = draft()
    missing.criteria.pop()
    const repeated = draft()
    repeated.criteria[4] = { ...repeated.criteria[0] }
    const invented = draft()
    invented.criteria[4] = { ...invented.criteria[4], id: "style" }

    for (const reply of [missing, repeated, invented]) {
      expect(assembleReading(reply, criteria, scene)).toMatchObject({
        ok: false,
        code: "criteria_mismatch",
      })
    }
  })

  it("rejects a score above the maximum, below zero or not finite", () => {
    for (const score of [150.01, -1, Number.NaN]) {
      expect(
        assembleReading(draft({}, [score, 80, 80, 100, 80]), criteria, scene)
      ).toMatchObject({
        ok: false,
        code: "score_out_of_range",
      })
    }
  })

  it("rejects a reply without a revision focus", () => {
    expect(
      assembleReading(draft({ revision: "  " }), criteria, scene)
    ).toMatchObject({
      ok: false,
      code: "missing_focus",
    })
  })

  it("discards a quote that is not in the scene and keeps the criterion when another remains", () => {
    const reply = draft()
    reply.criteria[0].evidence = [
      "ela quebrou o prato na cabeça dele",
      "Ela pegou uma panela",
    ]
    const result = assembleReading(reply, criteria, scene)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.discardedQuotes).toBe(1)
    expect(result.reading.criteria[0].evidence).toEqual([
      "Ela pegou uma panela",
    ])
  })

  it("rejects a criterion left without any quote from the scene, and an invented highlight", () => {
    const reply = draft()
    reply.criteria[2].evidence = ["a geladeira caiu sobre os dois"]

    expect(assembleReading(reply, criteria, scene)).toMatchObject({
      ok: false,
      code: "missing_evidence",
    })
    expect(
      assembleReading(
        draft({
          highlight: { description: "x", evidence: "Elisa venceu a luta" },
        }),
        criteria,
        scene
      )
    ).toMatchObject({ ok: false, code: "missing_evidence" })
  })

  it("keeps at most two distinct quotes per criterion", () => {
    const reply = draft()
    reply.criteria[1].evidence = [
      "Ela pegou uma panela",
      "ela pegou uma panela",
      "Rogério empurrou Elisa",
      "disse ele. Ela pegou",
    ]
    const result = assembleReading(reply, criteria, scene)

    expect(result.ok && result.reading.criteria[1].evidence).toEqual([
      "Ela pegou uma panela",
      "Rogério empurrou Elisa",
    ])
  })
})

describe("renderReadingMarkdown", () => {
  it("writes bands first and points beside them, without a total line", () => {
    const result = assembleReading(draft(), criteria, scene)
    if (!result.ok) throw new Error("expected a reading")
    const markdown = renderReadingMarkdown(result.reading, criteria)

    expect(markdown).toContain(
      "### Causa e efeito físico: Em esboço · 80 de 200"
    )
    expect(markdown).toContain("## Foco da revisão")
    expect(markdown).toContain("> “Ela pegou uma panela”")
    expect(markdown).not.toMatch(/Nota:/)
  })
})
