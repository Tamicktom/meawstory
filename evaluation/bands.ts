//* Local imports
import { scoreBandRanges } from "@/database/seed/render-rubric"

export const BANDS = ["missing", "thin", "working", "strong"] as const

export type Band = (typeof BANDS)[number]

//* Public names from docs/produto-fluxo-novo.md, section 5.4.
export const BAND_LABEL: Record<Band, string> = {
  missing: "Ausente",
  thin: "Em esboço",
  working: "Funciona",
  strong: "Forte",
}

export const TOTAL_POINTS = 1000

//* Same thresholds the rubric shows the model: up to 20%, 50%, 80% and 100% of the points.
export function bandForScore(score: number, points: number): Band {
  const ranges = scoreBandRanges(points)
  const index = ranges.findIndex(([, end]) => score <= end)

  return BANDS[index === -1 ? BANDS.length - 1 : index]
}

export function bandDistance(a: Band, b: Band): number {
  return Math.abs(BANDS.indexOf(a) - BANDS.indexOf(b))
}
