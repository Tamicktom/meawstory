const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
})

export function formatScore(score: string) {
  const value = Number(score)
  if (!score.trim() || !Number.isFinite(value)) return "Pontuação indisponível"
  const formatted = Number.isInteger(value)
    ? scoreFormatter.format(value)
    : value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  return `Pontuação: ${formatted} de 1000`
}
