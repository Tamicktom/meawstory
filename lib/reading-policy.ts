export const READING_DELAY_MS = 2 * 60_000
export const READING_TIMEOUT_MS = 10 * 60_000
export function countWords(content: string) {
  return content.trim().split(/\s+/u).filter(Boolean).length
}
export function sceneSizeError(content: string) {
  const count = countWords(content)
  return count < 100 || count > 2000
    ? `Sua cena tem ${count} palavras. Para ser lida, precisa ter entre 100 e 2.000 palavras. Ajuste o texto e tente de novo.`
    : null
}
export function readingLimitReset(dates: Date[], now: number) {
  let reset = 0
  for (const [window, limit] of [
    [86400000, 10],
    [600000, 3],
  ]) {
    const active = dates
      .map(Number)
      .filter((date) => date > now - window)
      .sort((a, b) => a - b)
    if (active.length >= limit)
      reset = Math.max(reset, active[active.length - limit] + window)
  }
  return reset ? new Date(reset) : null
}
