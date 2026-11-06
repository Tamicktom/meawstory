//* List prices used to cost each model call (1C-6). A price change adds a new entry with its own
//* effectiveFrom; old entries stay, so every stored cost can be traced to the price that produced it.
//* Reasoning tokens are billed as output tokens and are already counted in outputTokens.

export type ModelPrice = {
  modelId: string
  currency: "USD"
  //* First day (UTC) on which the price applies.
  effectiveFrom: string
  inputPerMillion: number
  cachedInputPerMillion: number
  outputPerMillion: number
  source: string
  checkedAt: string
}

export const MODEL_PRICES: readonly ModelPrice[] = [
  {
    modelId: "gpt-5-mini",
    currency: "USD",
    effectiveFrom: "2025-08-07",
    inputPerMillion: 0.25,
    cachedInputPerMillion: 0.025,
    outputPerMillion: 2,
    source: "https://developers.openai.com/api/docs/models/gpt-5-mini",
    checkedAt: "2026-11-05",
  },
]

export type CallUsage = {
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
  reasoningTokens: number | null
}

export function priceFor(
  modelId: string,
  at: Date,
  prices: readonly ModelPrice[] = MODEL_PRICES
): ModelPrice | null {
  const day = at.toISOString().slice(0, 10)

  return (
    prices
      .filter(
        (price) => price.modelId === modelId && price.effectiveFrom <= day
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null
  )
}

//* Cost in US dollars, or null when the usage is unknown: an unknown cost is never counted as zero.
export function callCost(usage: CallUsage, price: ModelPrice): number | null {
  if (usage.inputTokens === null || usage.outputTokens === null) return null

  const cached = Math.min(usage.cachedInputTokens ?? 0, usage.inputTokens)
  const fresh = usage.inputTokens - cached

  return (
    (fresh * price.inputPerMillion +
      cached * price.cachedInputPerMillion +
      usage.outputTokens * price.outputPerMillion) /
    1_000_000
  )
}
