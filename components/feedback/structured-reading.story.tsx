import {
  StructuredReadingView,
  type StructuredReadingProps,
} from "./structured-reading"

const scene =
  "A chave ficou na mesa entre as duas.\n\nEla esperou. A chave ficou na mesa entre as duas.\n\nFim."
const criteria = [
  "Aderência",
  "Estrutura",
  "Mundo",
  "Personagens",
  "Prosa",
].map((name, i) => ({
  id: `criterion-${i}`,
  name,
  maxScore: 200,
  publicDescription: `Descrição pública de ${name}.`,
}))
const props: StructuredReadingProps = {
  correctionId: "reading-1",
  title: "A escolha",
  exerciseTitle: "Uma decisão difícil",
  createdAt: "2026-11-06T10:00:00Z",
  version: 1,
  score: "640.00",
  scene,
  criteria,
  result: {
    version: 1,
    opening: "O silêncio entre as duas sustenta a escolha.",
    revision: "Mostre um gesto diante da chave antes da decisão.",
    highlight: {
      description: "A chave concentra a escolha.",
      evidence: "A chave ficou na mesa",
    },
    // Reverse order exercises the link by id, not by array position.
    criteria: [...criteria].reverse().map((c) => ({
      id: c.id,
      score: 128,
      band: "working",
      evidence: ["chave ficou na mesa entre as duas", "Ela esperou."],
      strengths: "O objeto ganha peso.",
      gaps: "Falta um gesto da personagem.",
    })),
  },
  feedback: { usefulness: null, disagreements: [] },
  reviseHref: "/dashboard/exercises/theme-1/write?textId=scene-1",
}
export function Ready() {
  return <StructuredReadingView {...props} />
}
export function Saved() {
  return (
    <StructuredReadingView
      {...props}
      feedback={{
        usefulness: "partly",
        disagreements: [
          { criterionId: "criterion-0", reason: "Minha intenção foi outra." },
        ],
      }}
    />
  )
}
export function Long() {
  return (
    <StructuredReadingView
      {...props}
      title={"Título".repeat(100)}
      scene={scene + "\n\n" + "palavra".repeat(100)}
    />
  )
}

export function Revision() {
  return (
    <StructuredReadingView
      {...props}
      version={2}
      revisionIntent="Tornar o gesto diante da chave visível."
      versions={[
        {
          version: 1,
          href: "/dashboard/texts/scene-1?versao=1",
          current: false,
        },
        { version: 2, href: "/dashboard/texts/scene-1", current: true },
      ]}
    />
  )
}

const comparisonCriteria = props.criteria.map((criterion, index) => {
  if (index === 0)
    return {
      id: criterion.id,
      previousScore: 128,
      score: 40,
      previousBand: "working" as const,
      band: "missing" as const,
      movement: "regressed" as const,
    }
  if (index === 1 || index === 2)
    return {
      id: criterion.id,
      previousScore: 128,
      score: 190,
      previousBand: "working" as const,
      band: "strong" as const,
      movement: "improved" as const,
    }
  return {
    id: criterion.id,
    previousScore: 128,
    score: 128,
    previousBand: "working" as const,
    band: "working" as const,
    movement: "unchanged" as const,
  }
})

export function Compared() {
  return (
    <StructuredReadingView
      {...props}
      version={2}
      revisionIntent="Tornar o gesto diante da chave visível."
      previousScene="A chave ficou na mesa entre as duas.\n\nFim."
      comparison={{
        version: 1,
        previousCorrectionId: "reading-0",
        textUnchanged: false,
        focus: {
          status: "met",
          answer: "O gesto de esperar aparece na versão nova.",
          evidence: "A chave ficou na mesa",
        },
        criteria: comparisonCriteria,
      }}
      versions={[
        {
          version: 1,
          href: "/dashboard/texts/scene-1?versao=1",
          current: false,
        },
        { version: 2, href: "/dashboard/texts/scene-1", current: true },
      ]}
    />
  )
}

export function UnchangedComparison() {
  return (
    <StructuredReadingView
      {...props}
      version={2}
      previousScene={scene}
      comparison={{
        version: 1,
        previousCorrectionId: "reading-0",
        textUnchanged: true,
        focus: { status: "unchanged" },
        criteria: props.criteria.map((criterion) => ({
          id: criterion.id,
          previousScore: 80,
          score: 128,
          previousBand: "thin" as const,
          band: "working" as const,
          movement: "unchanged" as const,
        })),
      }}
    />
  )
}

export function EarlierVersion() {
  return (
    <StructuredReadingView
      {...props}
      version={1}
      reviseHref={undefined}
      latestHref="/dashboard/texts/scene-1"
      versions={[
        {
          version: 1,
          href: "/dashboard/texts/scene-1?versao=1",
          current: true,
        },
        { version: 2, href: "/dashboard/texts/scene-1", current: false },
      ]}
    />
  )
}

export function RepeatedEvidence() {
  return (
    <StructuredReadingView
      {...props}
      result={{
        ...props.result,
        criteria: props.result.criteria.map((criterion) => ({
          ...criterion,
          evidence: [criterion.evidence[0], criterion.evidence[0]],
        })),
      }}
    />
  )
}
