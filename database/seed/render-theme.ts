export type ThemeDefinition = {
  id: string
  title: string
  rubricId: string
  situation: string
  alreadyTrue: string[]
  mustInclude: string[]
  youDecide: string
  length: string
}

export function renderTheme(definition: ThemeDefinition): string {
  const alreadyTrue = definition.alreadyTrue
    .map((item) => `- ${item}`)
    .join("\n")
  const mustInclude = definition.mustInclude
    .map((item) => `- ${item}`)
    .join("\n")

  return [
    "Escreva uma única cena a partir deste contexto. O que não estiver dito aqui é decisão sua.",
    "",
    "## Situação",
    "",
    definition.situation.trim(),
    "",
    "## O que já é verdade",
    "",
    alreadyTrue,
    "",
    "## O que a cena precisa conter",
    "",
    mustInclude,
    "",
    "## O que você decide",
    "",
    definition.youDecide.trim(),
    "",
    "## Extensão",
    "",
    definition.length.trim(),
    "",
  ].join("\n")
}
