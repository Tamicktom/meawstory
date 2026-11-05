import { ReadingState } from "./reading-state"
export function Pending() {
  return (
    <ReadingState
      textId="text-1"
      themeTitle="A cena"
      textContent={"Primeiro parágrafo.\n\nSegundo parágrafo."}
      status="PENDING"
      createdAt={new Date().toISOString()}
    />
  )
}
export function Delayed() {
  return (
    <ReadingState
      textId="text-1"
      themeTitle="A cena"
      textContent="Cena salva."
      status="IN_PROGRESS"
      createdAt={new Date(Date.now() - 180000).toISOString()}
    />
  )
}
export function Failed() {
  return (
    <ReadingState
      textId="text-1"
      themeTitle="A cena"
      textContent="Cena salva."
      status="FAILED"
      createdAt={new Date().toISOString()}
    />
  )
}
