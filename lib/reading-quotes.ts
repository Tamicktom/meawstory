//* A quotation counts only when it is a literal, contiguous stretch of the frozen scene (1C-3).
//* Matching tolerates what a model cannot reproduce byte for byte, and nothing else:
//* runs of whitespace, typographic quotes, dash and ellipsis variants, and letter case.
//* Accents, words and order must match. An omission marked with "..." does not match.

const MIN_QUOTE_WORDS = 3

const FOLDED: Record<string, string> = {
  "“": '"',
  "”": '"',
  "„": '"',
  "«": '"',
  "»": '"',
  "‘": "'",
  "’": "'",
  "‚": "'",
  "`": "'",
  "´": "'",
  "–": "-",
  "—": "-",
  "―": "-",
  "‐": "-",
  "‑": "-",
  "…": "...",
}

function foldCharacter(character: string): string {
  const folded = FOLDED[character] ?? character
  const lower = folded.toLowerCase()
  //* A lowercase form of another length would break the index map.
  return lower.length === folded.length ? lower : folded
}

type FoldedText = {
  value: string
  //* For each folded position, the index of the original character it came from.
  origin: number[]
}

function foldText(text: string): FoldedText {
  let value = ""
  const origin: number[] = []
  let pendingSpace = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (/\s/.test(character)) {
      pendingSpace = value.length > 0
      continue
    }

    if (pendingSpace) {
      value += " "
      origin.push(index - 1)
      pendingSpace = false
    }

    for (const piece of foldCharacter(character)) {
      value += piece
      origin.push(index)
    }
  }

  return { value, origin }
}

//* Quotation marks and surrounding punctuation the model adds around a quote are not part of it.
function trimQuote(quote: string): string {
  return quote
    .trim()
    .replace(/^[\s"'“”‘’«»„‚`´.,;:!?…\-–—]+/u, "")
    .replace(/[\s"'“”‘’«»„‚`´.,;:!?…\-–—]+$/u, "")
    .trim()
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length
}

//* Returns the scene's own characters for the quote, so the stored evidence can be marked in the scene later.
export function locateQuote(quote: string, scene: string): string | null {
  const trimmed = trimQuote(quote)

  if (wordCount(trimmed) < MIN_QUOTE_WORDS) return null

  const needle = foldText(trimmed).value
  const haystack = foldText(scene)
  const start = haystack.value.indexOf(needle)

  if (needle.length === 0 || start === -1) return null

  const end = start + needle.length - 1
  const originalStart = haystack.origin[start]
  const originalEnd = haystack.origin[end]

  return scene.slice(originalStart, originalEnd + 1)
}
