//* Components imports
import { Button } from "@/components/ui/button"

type SaveErrorProps = {
  error: string
  content: string
  expired: boolean
  locked: boolean
  textId?: string
  onRetry: () => void
  onNotice: (notice: string) => void
}

export function SaveError(props: SaveErrorProps) {
  async function copyText() {
    try {
      await navigator.clipboard.writeText(props.content)
      props.onNotice("Texto copiado")
    } catch {
      props.onNotice("Selecione o texto da cena e copie manualmente.")
    }
  }

  return (
    <div role="alert">
      <p>{props.error}</p>
      <Button variant="outline" onClick={props.onRetry}>
        Tentar salvar novamente
      </Button>
      <Button variant="outline" onClick={copyText}>
        Copiar texto
      </Button>
      {props.expired ? (
        <a
          href="/sign-in"
          target="_blank"
          rel="noopener noreferrer"
          className="block underline"
        >
          Entrar novamente em outra aba para salvar
        </a>
      ) : null}
      {props.locked && props.textId ? (
        <a
          className="block underline"
          href={`/dashboard/texts/${props.textId}`}
        >
          Abrir leitura — o texto enviado está preservado
        </a>
      ) : null}
    </div>
  )
}
