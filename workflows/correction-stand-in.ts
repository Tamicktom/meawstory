//* Libraries imports
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export type SavedCorrection = {
  content: string
  score: number
}

export function savedCorrectionStandInPath() {
  return path.join(process.cwd(), "tests/helpers/.saved-correction.json")
}

function isSavedCorrection(value: unknown): value is SavedCorrection {
  if (!value || typeof value !== "object") {
    return false
  }

  const content = "content" in value ? value.content : undefined
  const score = "score" in value ? value.score : undefined

  return (
    typeof content === "string" &&
    content.trim() !== "" &&
    typeof score === "number"
  )
}

//* Outside production, a JSON file written by the product-loop test replaces the model call.
//* A real user still goes through generateText.
export function readSavedCorrection(): SavedCorrection | null {
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const standInPath = savedCorrectionStandInPath()

  if (!existsSync(standInPath)) {
    return null
  }

  const parsed: unknown = JSON.parse(readFileSync(standInPath, "utf8"))

  if (!isSavedCorrection(parsed)) {
    throw new Error("Saved correction stand-in is invalid.")
  }

  return {
    content: parsed.content,
    score: parsed.score,
  }
}
