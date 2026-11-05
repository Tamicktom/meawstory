//* Libraries imports
import { describe, expect, it } from "bun:test"

//* Local imports
import {
  buildCorrectionPrompt,
  correctionOutputSchema,
  formatCorrectionScore,
} from "@/workflows/correction-grading"

const source = {
  themeTitle: "O vão entre os telhados",
  themeDescription: "Duas pessoas adultas estão num telhado.",
  textContent: "Ela mediu o vão e não pulou.",
  rubricTitle: "Cena de ação",
  rubricContent: "A nota da correção é a soma das notas dos critérios.",
}

describe("correctionOutputSchema", () => {
  it("accepts a correction and a score from 0 through 1000", () => {
    expect(
      correctionOutputSchema.parse({
        content: "Nota: 640",
        score: 640,
      })
    ).toEqual({
      content: "Nota: 640",
      score: 640,
    })
  })

  it("rejects an empty correction", () => {
    expect(
      correctionOutputSchema.safeParse({
        content: "   ",
        score: 10,
      }).success
    ).toBe(false)
  })

  it("rejects a score below 0", () => {
    expect(
      correctionOutputSchema.safeParse({
        content: "Nota: 0",
        score: -1,
      }).success
    ).toBe(false)
  })

  it("rejects a score above 1000", () => {
    expect(
      correctionOutputSchema.safeParse({
        content: "Nota: 1001",
        score: 1001,
      }).success
    ).toBe(false)
  })
})

describe("buildCorrectionPrompt", () => {
  it("includes the theme, the student text, and the rubric", () => {
    const prompt = buildCorrectionPrompt(source)

    expect(prompt).toContain(source.themeTitle)
    expect(prompt).toContain(source.themeDescription)
    expect(prompt).toContain(source.textContent)
    expect(prompt).toContain(source.rubricTitle)
    expect(prompt).toContain(source.rubricContent)
  })
})

describe("formatCorrectionScore", () => {
  it("keeps a whole score inside the range with two decimal places", () => {
    expect(formatCorrectionScore(0)).toBe("0.00")
    expect(formatCorrectionScore(640)).toBe("640.00")
    expect(formatCorrectionScore(1000)).toBe("1000.00")
  })

  it("rounds a score to two decimal places", () => {
    expect(formatCorrectionScore(812.344)).toBe("812.34")
    expect(formatCorrectionScore(812.346)).toBe("812.35")
  })

  it("rejects a score that falls outside 0 through 1000", () => {
    expect(() => formatCorrectionScore(-0.01)).toThrow(
      "Correction score is outside 0 through 1000."
    )
    expect(() => formatCorrectionScore(1000.009)).toThrow(
      "Correction score is outside 0 through 1000."
    )
  })
})
