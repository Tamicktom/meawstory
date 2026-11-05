import Link from "next/link"

export function LegalLinks({ newTab = false }: { newTab?: boolean }) {
  return (
    <nav
      aria-label="Termos e privacidade"
      className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
    >
      <Link
        href="/termos"
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className="inline-flex min-h-11 items-center underline underline-offset-4"
      >
        Termos de uso
        {newTab ? <span className="sr-only"> (abre em outra aba)</span> : null}
      </Link>
      <Link
        href="/privacidade"
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        className="inline-flex min-h-11 items-center underline underline-offset-4"
      >
        Política de privacidade
        {newTab ? <span className="sr-only"> (abre em outra aba)</span> : null}
      </Link>
    </nav>
  )
}
