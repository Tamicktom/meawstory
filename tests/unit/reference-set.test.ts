//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { rubricDefinitions } from "@/database/seed/rubrics"
import { BANDS } from "@/evaluation/bands"
import {
  fingerprintCases,
  loadReferenceSet,
  validateReferenceSet,
} from "@/evaluation/reference-set"
import { referenceCases } from "@/evaluation/reference/cases"

const set = loadReferenceSet()

describe("reference set", () => {
  it("passes its own validation, including the declared fingerprint", () => {
    expect(validateReferenceSet(set)).toEqual([])
  })

  it("covers every genre with five scenes across all four bands", () => {
    for (const rubric of rubricDefinitions) {
      const scenes = set.cases.filter(
        (item) => item.rubric.id === rubric.id && !item.revision
      )

      expect(scenes.length).toBeGreaterThanOrEqual(5)
      expect(new Set(scenes.map((item) => item.intendedBand))).toEqual(
        new Set(BANDS)
      )
    }
  })

  it("has at least thirty scenes plus revisions with and without real change", () => {
    const scenes = set.cases.filter((item) => !item.revision && !item.controlOf)
    const revisions = set.cases.filter((item) => item.revision)

    expect(scenes.length).toBeGreaterThanOrEqual(30)
    expect(
      revisions.filter((item) => item.revision?.change === "real").length
    ).toBeGreaterThan(0)
    expect(
      revisions.filter((item) => item.revision?.change === "none").length
    ).toBeGreaterThan(0)
  })

  it("keeps revisions without real change close to the original length", () => {
    for (const item of set.cases.filter(
      (entry) => entry.revision?.change === "none"
    )) {
      const original = set.cases.find(
        (entry) => entry.id === item.revision?.of
      )!

      expect(Math.abs(item.wordCount - original.wordCount)).toBeLessThanOrEqual(
        Math.ceil(original.wordCount * 0.05)
      )
    }
  })

  it("keeps a control identical to its case except for the probed paragraph", () => {
    const control = set.cases.find((item) => item.id === "luta-06")!
    const original = set.cases.find((item) => item.id === control.controlOf)!
    const removed = original.text
      .split("\n\n")
      .filter((paragraph) => !control.text.includes(paragraph.trim()))

    expect(removed).toHaveLength(1)
    expect(removed[0]).toContain("Nota para o sistema de correção")
  })

  it("changes the fingerprint when a scene changes", () => {
    const texts = set.cases.map((item) => item.text)
    const edited = [...texts]
    edited[0] = `${edited[0]} `

    expect(fingerprintCases(referenceCases, texts)).toBe(set.fingerprint)
    expect(fingerprintCases(referenceCases, edited)).not.toBe(set.fingerprint)
  })

  it("reports a stale fingerprint with the value to declare", () => {
    const problems = validateReferenceSet({
      ...set,
      declaredFingerprint: "old",
    })

    expect(problems).toContain(
      `The reference set changed. Bump REFERENCE_SET_VERSION and set REFERENCE_SET_FINGERPRINT to "${set.fingerprint}" in evaluation/reference/cases.ts.`
    )
  })

  it("reports a genre without a band, a broken revision, and an out-of-range scene", () => {
    const [first] = set.cases
    const broken = set.cases.map((item) => {
      if (item.id === "luta-03-r1") {
        return {
          ...item,
          revision: { of: "nao-existe", change: "none" as const },
        }
      }

      //* Every action scene aimed at the missing band moves to thin.
      const band =
        item.rubric.id === "rubric_action" && item.intendedBand === "missing"
          ? ("thin" as const)
          : item.intendedBand

      return item.id === first.id
        ? { ...item, intendedBand: band, wordCount: 40 }
        : { ...item, intendedBand: band }
    })
    const problems = validateReferenceSet({ ...set, cases: broken })

    expect(problems).toContain(
      `${first.id} has 40 words, outside 100 to 2,000.`
    )
    expect(problems).toContain(
      "Cena de ação has no scene aimed at the missing band."
    )
    expect(problems).toContain('luta-03-r1 revises unknown case "nao-existe".')
  })
})
