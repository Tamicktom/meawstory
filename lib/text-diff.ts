export type DiffSegment = {
  kind: "equal" | "added" | "removed"
  text: string
}

function tokenize(value: string): string[] {
  return value.split(/(\s+)/).filter((token) => token.length > 0)
}

function longestCommon(left: string[], right: string[]): number[][] {
  const table = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0)
  )

  for (let row = left.length - 1; row >= 0; row -= 1) {
    for (let column = right.length - 1; column >= 0; column -= 1) {
      table[row][column] =
        left[row] === right[column]
          ? table[row + 1][column + 1] + 1
          : Math.max(table[row + 1][column], table[row][column + 1])
    }
  }

  return table
}

function merge(segments: DiffSegment[]): DiffSegment[] {
  const merged: DiffSegment[] = []

  for (const segment of segments) {
    const last = merged.at(-1)
    if (last && last.kind === segment.kind) last.text += segment.text
    else merged.push({ ...segment })
  }

  return merged
}

//* Word diff that keeps the original spaces and line breaks.
export function diffTexts(previous: string, next: string): DiffSegment[] {
  const left = tokenize(previous)
  const right = tokenize(next)
  const table = longestCommon(left, right)
  const segments: DiffSegment[] = []
  let row = 0
  let column = 0

  while (row < left.length && column < right.length) {
    if (left[row] === right[column]) {
      segments.push({ kind: "equal", text: left[row] })
      row += 1
      column += 1
    } else if (table[row + 1][column] >= table[row][column + 1]) {
      segments.push({ kind: "removed", text: left[row] })
      row += 1
    } else {
      segments.push({ kind: "added", text: right[column] })
      column += 1
    }
  }

  for (const text of left.slice(row)) segments.push({ kind: "removed", text })
  for (const text of right.slice(column)) segments.push({ kind: "added", text })

  return merge(segments)
}
