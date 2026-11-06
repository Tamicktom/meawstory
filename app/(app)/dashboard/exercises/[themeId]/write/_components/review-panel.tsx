//* Components imports
import { Button } from "@/components/ui/button"

type ReviewPanelProps = {
  words: number
  minWords?: number
  maxWords?: number
  missing: string[]
  pending: boolean
  locked: boolean
  revisionIntent?: string
  onBack: () => void
  onConfirm: () => void
}

export function ReviewPanel(props: ReviewPanelProps) {
  const hasSuggestion = Boolean(props.minWords && props.maxWords)
  const outsideSuggestion =
    hasSuggestion &&
    (props.words < (props.minWords ?? 0) ||
      props.words > (props.maxWords ?? Infinity))

  return (
    <section
      aria-label="Conferir envio"
      className="flex flex-col gap-3 rounded-md border p-4"
    >
      <h2 className="font-medium">Confira antes de enviar</h2>
      <p>
        {props.words} palavras
        {hasSuggestion
          ? ` · Faixa pedida: ${props.minWords} a ${props.maxWords}`
          : ""}
      </p>
      {outsideSuggestion ? (
        <p>
          A cena está fora da extensão sugerida. Você pode ajustar o texto ou
          enviar assim mesmo.
        </p>
      ) : null}
      <p>Itens ainda não marcados:</p>
      <ul>
        {props.missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {props.missing.length === 0 ? <p>Nenhum item pendente.</p> : null}
      {props.revisionIntent !== undefined ? (
        <section
          className="flex flex-col gap-2"
          aria-label="Intenção da revisão"
        >
          <h3 className="font-medium">O que você tentou mudar</h3>
          <p className="whitespace-pre-wrap">
            {props.revisionIntent.trim()
              ? props.revisionIntent
              : "Não informada. O envio não exige este campo e ele não muda a pontuação."}
          </p>
        </section>
      ) : null}
      <p>
        Ao confirmar, esta versão fica congelada para a leitura.
        {props.revisionIntent !== undefined
          ? " A versão anterior permanece como foi lida."
          : ""}
      </p>
      <Button
        id="back-to-writing"
        type="button"
        variant="outline"
        disabled={props.pending}
        onClick={props.onBack}
      >
        Voltar a escrever
      </Button>
      <Button
        id="confirm-submission"
        type="button"
        disabled={props.pending || props.locked}
        onClick={props.onConfirm}
      >
        {props.pending ? "Enviando…" : "Confirmar envio"}
      </Button>
    </section>
  )
}
