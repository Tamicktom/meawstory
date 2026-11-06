//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import { rubricDefinitions } from "@/database/seed/rubrics"
import { bandForScore } from "@/evaluation/bands"
import {
  extractQuotes,
  median,
  parseCriterionScores,
  parseNotaLine,
  quoteFound,
  summarize,
} from "@/evaluation/reading-metrics"

const action = rubricDefinitions.find((item) => item.id === "rubric_action")!

//* Both shapes below were returned by the current reading setup.
const bulletReading = [
  "A cena equilibra espaço e um envelope que dita o ritmo da subida.",
  "",
  "- Aderência ao tema — 145/150",
  "  Cumpre o tema.",
  "- Movimento com consequência — 180/200",
  "- Clareza em velocidade — 170 de 200",
  "- Pressão e escolha",
  "  Nota: 220",
  "- Ritmo — 165/200",
  "",
  "Nota: 880",
].join("\n")

const headingReading = [
  "### 1. Aderência ao tema — 140/150",
  "### 2. Movimento com consequência — 160/200",
  "### 3. Clareza em velocidade (180/200)",
  "### 4. Pressão e escolha — 150/250",
  "### 5. Ritmo — 150/200",
  "",
  "**Nota: 780**",
].join("\n")

describe("parseCriterionScores", () => {
  it("reads list items and keeps an earlier mention in prose from winning", () => {
    expect(parseCriterionScores(bulletReading, action)).toEqual({
      "Aderência ao tema": 145,
      "Movimento com consequência": 180,
      "Clareza em velocidade": 170,
      "Pressão e escolha": 220,
      Ritmo: 165,
    })
  })

  it("reads numbered headings", () => {
    expect(Object.values(parseCriterionScores(headingReading, action))).toEqual(
      [140, 160, 180, 150, 150]
    )
  })

  it("reads a score written after the criterion range", () => {
    const reading = [
      "1. Aderência ao tema (0-150): 25",
      "2. Movimento com consequência (0-200) — 175",
      "### 3. Clareza em velocidade (0–200): **30**",
      "- Pressão e escolha (0-250): 90",
      "- Ritmo (0-200) - 60",
    ].join("\n")

    expect(Object.values(parseCriterionScores(reading, action))).toEqual([
      25, 175, 30, 90, 60,
    ])
  })

  it("leaves a criterion without a score as null", () => {
    expect(
      parseCriterionScores("Ritmo bom.\n\nNota: 300", action).Ritmo
    ).toBeNull()
  })
})

describe("parseNotaLine", () => {
  it("takes the last Nota line, with or without bold", () => {
    expect(parseNotaLine(bulletReading)).toBe(880)
    expect(parseNotaLine(headingReading)).toBe(780)
    expect(parseNotaLine("Nota final: 612,5")).toBe(612.5)
    expect(parseNotaLine("Sem nota.")).toBeNull()
  })
})

describe("quotes", () => {
  const scene =
    "Correu os três passos que o beiral permitia e pulou. Bateu na laje."

  it("extracts quotes of four words or more", () => {
    expect(
      extractQuotes(
        'Veja “Correu os três passos” e "pulou". Também “Bateu na laje da gráfica”.'
      )
    ).toEqual(["Correu os três passos", "Bateu na laje da gráfica"])
  })

  it("matches without accents, case or punctuation at the ends", () => {
    expect(
      quoteFound("correu os tres passos que o beiral permitia.", scene)
    ).toBe(true)
  })

  it("matches each piece of a quote with an ellipsis", () => {
    expect(quoteFound("Correu os três passos … Bateu na laje", scene)).toBe(
      true
    )
    expect(quoteFound("Correu os três passos … caiu no vão", scene)).toBe(false)
  })
})

describe("summaries", () => {
  it("uses the sample standard deviation", () => {
    const summary = summarize([600, 700, 800])!

    expect(summary.mean).toBe(700)
    expect(summary.sd).toBe(100)
    expect(summary.range).toBe(200)
    expect(summarize([])).toBeNull()
    expect(median([3, 1, 2, 4])).toBe(2.5)
  })

  it("maps scores to the rubric bands", () => {
    expect(bandForScore(200, 1000)).toBe("missing")
    expect(bandForScore(200.5, 1000)).toBe("thin")
    expect(bandForScore(800, 1000)).toBe("working")
    expect(bandForScore(801, 1000)).toBe("strong")
    expect(bandForScore(40, 200)).toBe("missing")
    expect(bandForScore(41, 200)).toBe("thin")
  })
})
