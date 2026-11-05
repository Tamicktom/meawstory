const NARRATIVE_SCORE_MAX = 1000

export type CriterionKind = "objective" | "subjective"

export type CriterionBands = {
  missing: string
  thin: string
  working: string
  strong: string
}

export type CriterionDefinition = {
  name: string
  points: number
  kind: CriterionKind
  description: string
  bands: CriterionBands
}

export type RubricDefinition = {
  id: string
  title: string
  purpose: string
  howToRead: string
  criteria: CriterionDefinition[]
  doNotPunish: string[]
}

const KIND_LABEL: Record<CriterionKind, string> = {
  objective: "objetivo",
  subjective: "subjetivo",
}

const SHARED_DO_NOT_PUNISH = [
  "Ortografia e gramática, exceto quando a frase fica ilegível.",
  "Um final triste, ambíguo ou sem vitória.",
  "Estilo seco, longo, cômico ou lírico, quando esse estilo serve à cena.",
  "Uma escolha moral diferente da sua. Avalie o ofício da cena.",
]

export function scoreBandRanges(points: number): Array<[number, number]> {
  if (!Number.isInteger(points) || points < 4) {
    throw new Error(
      `Criterion points must be an integer of at least 4. Received ${points}.`
    )
  }

  const missingEnd = Math.floor(points * 0.2)
  const thinEnd = Math.floor(points * 0.5)
  const workingEnd = Math.floor(points * 0.8)
  const ranges: Array<[number, number]> = [
    [0, missingEnd],
    [missingEnd + 1, thinEnd],
    [thinEnd + 1, workingEnd],
    [workingEnd + 1, points],
  ]

  for (const [start, end] of ranges) {
    if (start > end) {
      throw new Error(`Score bands overlap or invert for ${points} points.`)
    }
  }

  return ranges
}

function formatRange(range: [number, number]): string {
  return `${range[0]}-${range[1]}`
}

const SCORING_RULES = [
  "Não ultrapasse o máximo de cada critério.",
  "Escolha um número dentro da faixa, não apenas o limite dela.",
  "Critério sem evidência no texto fica na faixa mais baixa.",
  "Critério subjetivo também precisa de evidência: uma citação curta ou uma paráfrase precisa. Sem isso, não use a faixa mais alta.",
  "Não existe enredo, final ou moral certos. Avalie a cena que foi escrita.",
  "Uma escolha incomum vale tanto quanto uma escolha familiar quando a cena a sustenta.",
  "Duas cenas podem chegar à mesma nota por caminhos diferentes. Use a faixa cuja descrição estiver mais perto do texto.",
  "Não avalie a pessoa que escreveu. Avalie este texto.",
  "Compare o texto com o objetivo da cena, não com ficção publicada. Um texto de prática pode tirar nota alta.",
]

const CORRECTION_STEPS = [
  "1. Abra com dois ou três períodos sobre o que a cena está fazendo.",
  "2. Para cada critério, dê a nota, o que está funcionando, o que está faltando ou forçado, e uma citação curta do texto.",
  "3. Feche a soma numa linha própria, no formato Nota: N, em que N é a soma, de 0 a 1000.",
  "4. Termine com uma revisão concreta que a pessoa possa tentar na próxima versão. Não reescreva a cena no lugar dela.",
]

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n")
}

function renderCriterion(
  criterion: CriterionDefinition,
  index: number
): string {
  const ranges = scoreBandRanges(criterion.points)
  const bands = [
    criterion.bands.missing,
    criterion.bands.thin,
    criterion.bands.working,
    criterion.bands.strong,
  ]
  const bandLines = ranges
    .map((range, bandIndex) => `- ${formatRange(range)}: ${bands[bandIndex]}`)
    .join("\n")

  return [
    `### ${index + 1}. ${criterion.name} (${formatRange([0, criterion.points])}, ${KIND_LABEL[criterion.kind]})`,
    "",
    criterion.description.trim(),
    "",
    bandLines,
  ].join("\n")
}

function renderRubricDocument(input: {
  title: string
  purpose: string
  howToRead: string
  criteria: string
  doNotPunish: string
}): string {
  return [
    `# ${input.title}`,
    "",
    "## Para que serve",
    "",
    input.purpose,
    "",
    "## Como ler o texto",
    "",
    input.howToRead,
    "",
    "## Como dar a nota",
    "",
    "A nota da correção é a soma das notas dos critérios. Ela vai de 0 a 1000, inclusive, com no máximo duas casas decimais.",
    "",
    bulletList(SCORING_RULES),
    "",
    "## Critérios",
    "",
    "Os três primeiros critérios são objetivos: dá para apontar se o elemento está na cena. Os dois últimos são subjetivos: avaliam qualidade narrativa e admitem mais de uma leitura, desde que a nota se apoie no texto.",
    "",
    input.criteria,
    "",
    "## O que não penalizar",
    "",
    input.doNotPunish,
    "",
    "## O que escrever na correção",
    "",
    "Escreva a correção em markdown.",
    "",
    CORRECTION_STEPS.join("\n"),
    "",
  ].join("\n")
}

export function renderRubric(definition: RubricDefinition): string {
  const total = definition.criteria.reduce(
    (sum, criterion) => sum + criterion.points,
    0
  )

  if (total !== NARRATIVE_SCORE_MAX) {
    throw new Error(
      `Rubric "${definition.id}" criteria sum to ${total}. They must sum to ${NARRATIVE_SCORE_MAX}.`
    )
  }

  return renderRubricDocument({
    title: definition.title,
    purpose: definition.purpose.trim(),
    howToRead: definition.howToRead.trim(),
    criteria: definition.criteria
      .map((criterion, index) => renderCriterion(criterion, index))
      .join("\n\n"),
    doNotPunish: bulletList([
      ...SHARED_DO_NOT_PUNISH,
      ...definition.doNotPunish,
    ]),
  })
}
