//* Libraries imports
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

//* Local imports
import { rubricSeeds, themeSeeds } from "@/database/seed/catalog"
import type { RubricDefinition } from "@/database/seed/render-rubric"
import type { RubricCriteria } from "@/lib/reading-contract"
import { rubricDefinitions } from "@/database/seed/rubrics"
import { BANDS, type Band } from "@/evaluation/bands"
import {
  REFERENCE_SET_FINGERPRINT,
  REFERENCE_SET_VERSION,
  referenceCases,
  type ReferenceCaseDefinition,
} from "@/evaluation/reference/cases"
import { countWords } from "@/lib/reading-policy"

export const REFERENCE_ROOT = path.join(process.cwd(), "evaluation/reference")

const SCENES_PER_GENRE = 5

export type ReferenceCase = ReferenceCaseDefinition & {
  text: string
  wordCount: number
  theme: { id: string; title: string; description: string }
  rubric: {
    id: string
    title: string
    content: string
    criteria: RubricCriteria
    definition: RubricDefinition
  }
}

export type ReferenceSet = {
  version: string
  declaredFingerprint: string
  fingerprint: string
  cases: ReferenceCase[]
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export type RecordedSourceHashes = {
  textSha256: string
  themeSha256: string
  rubricSha256: string
}

//* A measurement is comparable only when the current sources hash to what was measured.
export function measuredSourcesMatch(
  item: ReferenceCase | undefined,
  recorded: RecordedSourceHashes | undefined
): boolean {
  if (!item || !recorded) return false
  const current = [
    sha256(item.text),
    sha256(item.theme.description),
    sha256(item.rubric.content),
  ]
  const measured = [
    recorded.textSha256,
    recorded.themeSha256,
    recorded.rubricSha256,
  ]
  return current.every((hash, index) => hash === measured[index])
}

function sceneFilePath(root: string, caseId: string): string {
  return path.join(root, "scenes", `${caseId}.txt`)
}

//* Changing a case, its order or its scene changes the fingerprint.
export function fingerprintCases(
  definitions: ReferenceCaseDefinition[],
  texts: string[]
): string {
  return sha256(JSON.stringify({ definitions, texts }))
}

function resolveCase(
  definition: ReferenceCaseDefinition,
  text: string
): ReferenceCase {
  const theme = themeSeeds.find((item) => item.id === definition.themeId)

  if (!theme) {
    throw new Error(
      `Reference case "${definition.id}" points at unknown theme "${definition.themeId}".`
    )
  }

  const rubric = rubricSeeds.find((item) => item.id === theme.rubricId)
  const rubricDefinition = rubricDefinitions.find(
    (item) => item.id === theme.rubricId
  )

  if (!rubric || !rubricDefinition) {
    throw new Error(
      `Theme "${theme.id}" points at unknown rubric "${theme.rubricId}".`
    )
  }

  return {
    ...definition,
    text,
    wordCount: countWords(text),
    theme: {
      id: theme.id,
      title: theme.title,
      description: theme.description,
    },
    rubric: { ...rubric, definition: rubricDefinition },
  }
}

export function loadReferenceSet(root: string = REFERENCE_ROOT): ReferenceSet {
  const texts = referenceCases.map((definition) => {
    const file = sceneFilePath(root, definition.id)

    if (!existsSync(file)) {
      throw new Error(
        `Reference case "${definition.id}" has no scene at ${file}.`
      )
    }

    return readFileSync(file, "utf8")
  })

  return {
    version: REFERENCE_SET_VERSION,
    declaredFingerprint: REFERENCE_SET_FINGERPRINT,
    fingerprint: fingerprintCases(referenceCases, texts),
    cases: referenceCases.map((definition, index) =>
      resolveCase(definition, texts[index])
    ),
  }
}

function genreProblems(cases: ReferenceCase[]): string[] {
  const problems: string[] = []

  for (const rubric of rubricDefinitions) {
    const scenes = cases.filter(
      (item) =>
        item.rubric.id === rubric.id &&
        !item.revision &&
        !item.controlOf &&
        !item.injectedInto
    )
    const bands = new Set<Band>(scenes.map((item) => item.intendedBand))
    const themes = new Set(scenes.map((item) => item.theme.id))
    const catalogThemes = themeSeeds.filter(
      (item) => item.rubricId === rubric.id
    )

    if (scenes.length < SCENES_PER_GENRE) {
      problems.push(
        `${rubric.title} has ${scenes.length} scenes. It needs at least ${SCENES_PER_GENRE}.`
      )
    }

    for (const band of BANDS) {
      if (!bands.has(band)) {
        problems.push(`${rubric.title} has no scene aimed at the ${band} band.`)
      }
    }

    for (const theme of catalogThemes) {
      if (!themes.has(theme.id)) {
        problems.push(`${rubric.title} has no scene for theme "${theme.id}".`)
      }
    }
  }

  return problems
}

function revisionProblems(cases: ReferenceCase[]): string[] {
  const problems: string[] = []
  const byId = new Map(cases.map((item) => [item.id, item]))
  const changes = new Set(cases.flatMap((item) => item.revision?.change ?? []))

  for (const item of cases) {
    if (!item.revision) continue

    const original = byId.get(item.revision.of)

    if (!original) {
      problems.push(`${item.id} revises unknown case "${item.revision.of}".`)
      continue
    }

    if (original.revision) {
      problems.push(
        `${item.id} revises ${original.id}, which is itself a revision.`
      )
    }

    if (original.theme.id !== item.theme.id) {
      problems.push(`${item.id} and ${original.id} use different themes.`)
    }

    if (original.text.trim() === item.text.trim()) {
      problems.push(`${item.id} has the same text as ${original.id}.`)
    }
  }

  for (const change of ["real", "none"] as const) {
    if (!changes.has(change)) {
      problems.push(`The set has no revision with change "${change}".`)
    }
  }

  return problems
}

function sceneFileProblems(root: string, cases: ReferenceCase[]): string[] {
  const ids = new Set(cases.map((item) => item.id))

  return readdirSync(path.join(root, "scenes"))
    .filter((file) => file.endsWith(".txt"))
    .map((file) => file.slice(0, -".txt".length))
    .filter((id) => !ids.has(id))
    .map((id) => `Scene file "${id}.txt" has no reference case.`)
}

//* An injection probe copies a case of the same theme and adds the instruction.
function injectionProblems(
  item: ReferenceCase,
  casesById: Map<string, ReferenceCase>
): string[] {
  if (!item.injectedInto) return []
  const base = casesById.get(item.injectedInto)

  if (!base || base.theme.id !== item.theme.id)
    return [
      `${item.id} injects into "${item.injectedInto}", which is not a case of the same theme.`,
    ]
  if (!item.text.includes(base.text.trim().split("\n")[0]))
    return [`${item.id} does not copy the text of ${base.id}.`]
  return []
}

export function validateReferenceSet(
  set: ReferenceSet,
  root: string = REFERENCE_ROOT
): string[] {
  const problems: string[] = []
  const seen = new Set<string>()

  const casesById = new Map(set.cases.map((entry) => [entry.id, entry]))

  for (const item of set.cases) {
    if (seen.has(item.id))
      problems.push(`Duplicate reference case "${item.id}".`)
    seen.add(item.id)

    if (Number(item.textVersion ?? "1") > Number(set.version)) {
      problems.push(`${item.id} has a textVersion above the set version.`)
    }

    if (
      item.controlOf &&
      !set.cases.some((entry) => entry.id === item.controlOf)
    ) {
      problems.push(`${item.id} controls unknown case "${item.controlOf}".`)
    }

    problems.push(...injectionProblems(item, casesById))

    //* The product only reads scenes inside this range; see lib/reading-policy.ts.
    if (item.wordCount < 100 || item.wordCount > 2000) {
      problems.push(
        `${item.id} has ${item.wordCount} words, outside 100 to 2,000.`
      )
    }
  }

  if (set.fingerprint !== set.declaredFingerprint) {
    problems.push(
      `The reference set changed. Bump REFERENCE_SET_VERSION and set REFERENCE_SET_FINGERPRINT to "${set.fingerprint}" in evaluation/reference/cases.ts.`
    )
  }

  return [
    ...problems,
    ...genreProblems(set.cases),
    ...revisionProblems(set.cases),
    ...sceneFileProblems(root, set.cases),
  ]
}
