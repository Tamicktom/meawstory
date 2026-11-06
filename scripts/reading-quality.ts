// bun run ops:quality [--since 7d] [--candidates /path/to/candidates.json]
import { parseArgs } from "node:util"
import { writeFile } from "node:fs/promises"
import {
  readingQuality,
  readingQualityCandidates,
} from "@/services/reading-quality"

const { values } = parseArgs({
  options: {
    since: { type: "string", default: "7d" },
    candidates: { type: "string" },
  },
})
const until = new Date()
const relative = values.since!.match(/^(\d+)([hd])$/)
const since = relative
  ? new Date(
      until.getTime() -
        Number(relative[1]) * (relative[2] === "d" ? 24 : 1) * 3600000
    )
  : new Date(values.since!)
if (Number.isNaN(since.getTime()) || since >= until)
  throw new Error("Use --since 7d, 24h ou uma data anterior a agora.")
const window = { since, until }
const groups = await readingQuality(window)
console.log(
  `Qualidade percebida · leituras criadas de ${since.toISOString()} a ${until.toISOString()}`
)
console.table(groups)
console.log(
  "Respostas são escolhas atuais por leitura; ausência de resposta não significa Não. Discordâncias não alteram a avaliação."
)
if (values.candidates) {
  await writeFile(
    values.candidates,
    JSON.stringify(
      { since, until, candidates: await readingQualityCandidates(window) },
      null,
      2
    ),
    { mode: 0o600 }
  )
  console.log(
    `Candidatos para investigação salvos em ${values.candidates}. Revise antes de alterar o conjunto de referência.`
  )
}
process.exit(0)
