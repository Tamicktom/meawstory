//* Local imports
import { bandForScore } from "@/evaluation/bands"
import { BAND_LABEL, type BandId, type Genre } from "@/lib/reading-contract"
import type { CorrectionStatus } from "@/database/schema"

const SCENE_SITUATIONS = [
  "draft",
  "waiting",
  "reading",
  "failed",
  "revising",
  "ready",
  "closed",
] as const

export type SceneSituation = (typeof SCENE_SITUATIONS)[number]

const SITUATION_LABEL = {
  draft: "Rascunho salvo",
  waiting: "Leitura aguardando",
  reading: "Leitura em andamento",
  failed: "Leitura com falha",
  revising: "Em revisão",
} as const

export const SCENE_FILTERS = [
  { id: "draft", label: SITUATION_LABEL.draft },
  { id: "waiting", label: SITUATION_LABEL.waiting },
  { id: "reading", label: SITUATION_LABEL.reading },
  { id: "failed", label: SITUATION_LABEL.failed },
  { id: "revising", label: SITUATION_LABEL.revising },
  { id: "missing", label: BAND_LABEL.missing },
  { id: "thin", label: BAND_LABEL.thin },
  { id: "working", label: BAND_LABEL.working },
  { id: "strong", label: BAND_LABEL.strong },
  { id: "closed", label: "Encerrada" },
] as const

const BAND_FILTERS = ["missing", "thin", "working", "strong"] as const
const STATE_FILTERS = [
  "draft",
  "waiting",
  "reading",
  "failed",
  "revising",
] as const

export type SceneAttempt = {
  status: CorrectionStatus
  score: string
  textContent: string
  openedAt: Date | null
}

export type SceneStatusInput = {
  closed: boolean
  content: string
  //* Newest active attempt first. Failed attempts stay in this list and are not versions.
  attempts: SceneAttempt[]
}

export type SceneStatus = {
  situation: SceneSituation
  band: BandId | null
  label: string
  versionCount: number
  unopened: boolean
}

export function versionCountLabel(count: number) {
  if (count === 0) return "Nenhuma versão"
  if (count === 1) return "1 versão"
  return `${count} versões`
}

export function sceneStatus(input: SceneStatusInput): SceneStatus {
  const latest = input.attempts[0] ?? null
  const completed = input.attempts.filter(
    (attempt) => attempt.status === "COMPLETED"
  )
  const latestCompleted = completed[0] ?? null
  const band = latestCompleted
    ? bandForScore(Number(latestCompleted.score), 1000)
    : null
  const versionCount = completed.length
  const unopened = latestCompleted != null && latestCompleted.openedAt == null

  if (input.closed) {
    return {
      situation: "closed",
      band,
      label: band ? `Encerrada · ${BAND_LABEL[band]}` : "Encerrada",
      versionCount,
      unopened,
    }
  }

  if (!latest) {
    return {
      situation: "draft",
      band: null,
      label: SITUATION_LABEL.draft,
      versionCount: 0,
      unopened: false,
    }
  }

  if (latest.status === "PENDING") {
    return situation("waiting", versionCount, unopened)
  }

  if (latest.status === "IN_PROGRESS") {
    return situation("reading", versionCount, unopened)
  }

  if (latest.status === "FAILED") {
    return situation("failed", versionCount, unopened)
  }

  if (input.content !== latest.textContent) {
    return {
      situation: "revising",
      band,
      label: SITUATION_LABEL.revising,
      versionCount,
      unopened,
    }
  }

  return {
    situation: "ready",
    band,
    label: band ? BAND_LABEL[band] : "Leitura concluída",
    versionCount,
    unopened,
  }
}

function situation(
  name: "waiting" | "reading" | "failed",
  versionCount: number,
  unopened: boolean
): SceneStatus {
  return {
    situation: name,
    band: null,
    label: SITUATION_LABEL[name],
    versionCount,
    unopened,
  }
}

export function sceneMatchesGenre(genre: Genre | null, filter: string) {
  if (!filter) return true
  return genre === filter
}

export function sceneMatchesFilter(status: SceneStatus, filter: string) {
  if (!filter) return true
  if (filter === "closed") return status.situation === "closed"
  if (STATE_FILTERS.includes(filter as (typeof STATE_FILTERS)[number])) {
    return status.situation === filter
  }
  if (BAND_FILTERS.includes(filter as (typeof BAND_FILTERS)[number])) {
    return status.situation === "ready" && status.band === filter
  }
  return false
}
