import { expect, test } from "bun:test"
import { evidenceSegments } from "@/lib/reading-evidence"

test("overlapping, nested and repeated quotes preserve every character and every evidence link", () => {
  const scene = "A chave ficou na mesa.\n\nA chave ficou na mesa."
  const segments = evidenceSegments(scene, [
    "A chave ficou",
    "chave ficou na mesa",
    "chave ficou",
    "fora da cena",
  ])
  expect(segments.map((s) => s.text).join("")).toBe(scene)
  expect(
    segments
      .filter((s) => s.quotes.includes(0))
      .map((s) => s.text)
      .join("")
  ).toBe("A chave ficouA chave ficou")
  expect(
    segments
      .filter((s) => s.quotes.includes(1))
      .map((s) => s.text)
      .join("")
  ).toBe("chave ficou na mesachave ficou na mesa")
  expect(segments.some((s) => s.quotes.length === 3)).toBe(true)
  expect(segments.some((s) => s.quotes.includes(3))).toBe(false)
})

test("unquoted scene and unicode remain unchanged", () => {
  const scene = "— Você? 🐈\n\nSim."
  expect(
    evidenceSegments(scene, [])
      .map((s) => s.text)
      .join("")
  ).toBe(scene)
  expect(evidenceSegments("", ["quote"])).toEqual([])
})
