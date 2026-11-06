//* Libraries imports
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

//* Local imports
import {
  correctionOutputSchema,
  type CorrectionModelOutput,
} from "@/workflows/correction-config"

//* The stand-in is a model reply, not a finished reading: it goes through the same validation.
export type SavedCorrection = CorrectionModelOutput

export function savedCorrectionStandInPath() {
  return path.join(process.cwd(), "tests/helpers/.saved-correction.json")
}

//* Local development and explicit E2E runs can use the setup's model reply.
//* A real user still goes through generateText.
export function readSavedCorrection(): SavedCorrection | null {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.MEAWSTORY_E2E !== "1"
  ) {
    return null
  }

  const standInPath = savedCorrectionStandInPath()

  if (!existsSync(standInPath)) {
    if (process.env.MEAWSTORY_E2E === "1")
      throw new Error("Saved correction stand-in is missing in E2E mode.")
    return null
  }

  const parsed = correctionOutputSchema.safeParse(
    JSON.parse(readFileSync(standInPath, "utf8"))
  )

  if (!parsed.success) {
    throw new Error("Saved correction stand-in is invalid.")
  }

  return parsed.data
}
