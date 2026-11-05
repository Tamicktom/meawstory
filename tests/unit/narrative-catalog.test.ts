//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { rubricSeeds, themeSeeds } from "@/database/seed/catalog"
import { scoreBandRanges } from "@/database/seed/render-rubric"
import { rubricDefinitions } from "@/database/seed/rubrics"
import { themeDefinitions } from "@/database/seed/themes"

const themeSections = [
  "## Situação",
  "## O que já é verdade",
  "## O que a cena precisa conter",
  "## O que você decide",
  "## Extensão",
]

function expectSharedCriterionWeights() {
  expect(rubricDefinitions.length).toBeGreaterThan(0)

  for (const definition of rubricDefinitions) {
    expect(definition.criteria.map((criterion) => criterion.points)).toEqual([
      150, 200, 200, 250, 200,
    ])
    expect(
      definition.criteria.reduce((sum, criterion) => sum + criterion.points, 0)
    ).toBe(1000)
  }
}

function expectCriterionKinds() {
  for (const definition of rubricDefinitions) {
    expect(definition.criteria.map((criterion) => criterion.kind)).toEqual([
      "objective",
      "objective",
      "objective",
      "subjective",
      "subjective",
    ])
  }
}

function expectRubricMarkdown() {
  expect(rubricSeeds).toHaveLength(rubricDefinitions.length)

  for (const item of rubricSeeds) {
    expect(item.content.startsWith(`# ${item.title}`)).toBe(true)
    expect(item.content).toContain("## Como dar a nota")
    expect(item.content).toContain(
      "Ela vai de 0 a 1000, inclusive, com no máximo duas casas decimais."
    )
    expect(item.content).toContain("objetivo")
    expect(item.content).toContain("subjetivo")
    expect(item.content).toContain("Não existe enredo, final ou moral certos.")
    expect(item.content).toContain("Nota: N")
    expect(item.content).toContain("0-40:")
    expect(item.content).toContain("201-250:")
  }
}

function expectThemesPointAtCatalogRubrics() {
  const rubricIds = new Set(rubricSeeds.map((item) => item.id))

  expect(themeSeeds.length).toBeGreaterThan(0)

  for (const item of themeSeeds) {
    expect(rubricIds.has(item.rubricId)).toBe(true)
  }
}

function expectThemeBriefs() {
  expect(themeSeeds).toHaveLength(themeDefinitions.length)

  for (const item of themeSeeds) {
    for (const section of themeSections) {
      expect(item.description).toContain(section)
    }

    expect(item.description).toContain(
      "O que não estiver dito aqui é decisão sua."
    )
    expect(item.description.length).toBeGreaterThan(500)
  }

  for (const definition of themeDefinitions) {
    expect(definition.alreadyTrue.length).toBeGreaterThanOrEqual(3)
    expect(definition.mustInclude.length).toBeGreaterThanOrEqual(3)
    expect(definition.youDecide.length).toBeGreaterThan(40)
    expect(definition.length.toLowerCase()).toContain("palavras")
  }
}

describe("scoreBandRanges", () => {
  it("splits 200 points into four contiguous bands", () => {
    expect(scoreBandRanges(200)).toEqual([
      [0, 40],
      [41, 100],
      [101, 160],
      [161, 200],
    ])
  })

  it("splits 150 points into four contiguous bands", () => {
    expect(scoreBandRanges(150)).toEqual([
      [0, 30],
      [31, 75],
      [76, 120],
      [121, 150],
    ])
  })
})

describe("narrative catalog", () => {
  describe("rubrics", () => {
    it("scores every rubric from 0 through 1000 as the sum of the same criteria weights", () => {
      expectSharedCriterionWeights()
    })

    it("keeps three objective criteria and two subjective criteria on every rubric", () => {
      expectCriterionKinds()
    })

    it("writes each rubric as markdown a grader can score from", () => {
      expectRubricMarkdown()
    })
  })

  describe("themes", () => {
    it("points every theme at a rubric in the catalog", () => {
      expectThemesPointAtCatalogRubrics()
    })

    it("gives each theme a situation, constraints, and an open ending", () => {
      expectThemeBriefs()
    })
  })
})
