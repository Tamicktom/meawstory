//* Libraries imports
import { unlink, writeFile } from "node:fs/promises"

//* Local imports
import {
  savedCorrectionStandInPath,
  type SavedCorrection,
} from "@/workflows/correction-stand-in"

//* Every e2e scene repeats this sentence, so the quotes pass the server's literal check.
const SCENE_SENTENCE = "A chave ficou na mesa entre as duas."

//* A model reply for the catalog rubrics: 96 + 128 + 128 + 160 + 128 = 640.
export const savedCorrection: SavedCorrection = {
  criteria: [
    ["fidelity", 96],
    ["shape", 128],
    ["world", 128],
    ["people", 160],
    ["prose", 128],
  ].map(([id, score]) => ({
    id: id as string,
    score: score as number,
    strengths: "A chave sustenta a cena do começo ao fim.",
    gaps: "Falta mostrar o que cada uma faz com ela.",
    evidence: [SCENE_SENTENCE],
  })),
  highlight: {
    description: "A chave concentra a escolha num só objeto.",
    evidence: SCENE_SENTENCE,
  },
  opening: "A cena pousou: a chave ficou onde a escolha a deixou.",
  revision: "Mostre um gesto de cada uma diante da chave antes da decisão.",
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
