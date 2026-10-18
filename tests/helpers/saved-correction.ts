//* Libraries imports
import { unlink, writeFile } from "node:fs/promises"

//* Local imports
import {
  savedCorrectionStandInPath,
  type SavedCorrection,
} from "@/workflows/correction-stand-in"

export const savedCorrection: SavedCorrection = {
  content: "A cena pousou: a chave ficou onde a escolha a deixou.",
  score: 640,
}

export async function writeSavedCorrection() {
  await writeFile(savedCorrectionStandInPath(), JSON.stringify(savedCorrection))
}

export async function removeSavedCorrection() {
  try {
    await unlink(savedCorrectionStandInPath())
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return
    }

    throw error
  }
}
