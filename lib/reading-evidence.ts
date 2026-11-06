// Partition at every boundary: overlapping evidence never duplicates or hides scene text.
export function evidenceSegments(scene: string, quotes: string[]) {
  const ranges: { start: number; end: number; quote: number }[] = []
  quotes.forEach((quote, index) => {
    if (!quote) return
    let start = scene.indexOf(quote)
    while (start !== -1) {
      ranges.push({ start, end: start + quote.length, quote: index })
      start = scene.indexOf(quote, start + 1)
    }
  })
  const boundaries = [
    ...new Set([0, scene.length, ...ranges.flatMap((r) => [r.start, r.end])]),
  ].sort((a, b) => a - b)
  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1]
    return {
      start,
      text: scene.slice(start, end),
      quotes: [
        ...new Set(
          ranges
            .filter((r) => r.start <= start && r.end >= end)
            .map((r) => r.quote)
        ),
      ],
    }
  })
}
