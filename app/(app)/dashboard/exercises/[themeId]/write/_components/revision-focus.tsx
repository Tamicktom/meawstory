export type RevisionQuote = {
  label: string
  text: string
}

type RevisionFocusProps = {
  focus: string
  quotes: RevisionQuote[]
}

export function RevisionFocus(props: RevisionFocusProps) {
  return (
    <div className="flex flex-col gap-4 py-3">
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Foco desta versão</h2>
        <p id="revision-focus" className="whitespace-pre-wrap">
          {props.focus}
        </p>
      </section>
      <details open className="flex flex-col gap-2">
        <summary className="cursor-pointer py-2 font-medium">
          Trechos citados
        </summary>
        <ul className="flex flex-col gap-3 py-2">
          {props.quotes.map((quote) => (
            <li
              key={`${quote.label}-${quote.text}`}
              className="flex flex-col gap-1"
            >
              <p className="text-sm text-muted-foreground">{quote.label}</p>
              <blockquote className="border-l-2 py-1 pl-3 italic">
                “{quote.text}”
              </blockquote>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
