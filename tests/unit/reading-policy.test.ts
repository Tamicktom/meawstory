import { expect, test } from "bun:test"
import {
  countWords,
  readingLimitReset,
  sceneSizeError,
} from "@/lib/reading-policy"
test("word boundaries and absolute limits", () => {
  expect(countWords(" \n um\tdois\n\ntrês ")).toBe(3)
  for (const size of [0, 99, 2001])
    expect(sceneSizeError("cena ".repeat(size))).toContain(`${size}`)
  for (const size of [100, 2000])
    expect(sceneSizeError("cena ".repeat(size))).toBeNull()
})
test("rolling windows report when both limits permit admission", () => {
  const now = Date.now()
  expect(readingLimitReset([new Date(now - 600000)], now)).toBeNull()
  expect(
    readingLimitReset(
      [0, 1, 2].map((i) => new Date(now - i * 1000)),
      now
    )
  ).toEqual(new Date(now + 598000))
  expect(
    readingLimitReset(
      Array.from({ length: 10 }, (_, i) => new Date(now - 3600000 - i * 1000)),
      now
    )
  ).toEqual(new Date(now + 86400000 - 3600000 - 9000))
})
