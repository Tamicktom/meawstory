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
    criteria: [...criteria]
      .reverse()
      .map((c) => ({
        id: c.id,
        score: 128,
        band: "working",
        evidence: ["chave ficou na mesa entre as duas", "Ela esperou."],
        strengths: "O objeto ganha peso.",
        gaps: "Falta um gesto da personagem.",
      })),
  },
  feedback: { usefulness: null, disagreements: [] },
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
