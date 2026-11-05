"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ErrorView({
  retry,
  savedScenes = false,
}: {
  retry: () => void
  savedScenes?: boolean
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-start gap-4 p-4 [overflow-wrap:anywhere]">
      <h1 className="font-heading text-2xl font-medium">
        Não foi possível abrir esta página
      </h1>
      <p role="alert">
        Ocorreu um problema inesperado. Tente carregar a página de novo.
      </p>
      {savedScenes ? (
        <p>As cenas já salvas não foram alteradas por este erro.</p>
      ) : null}
      <Button className="min-h-11 w-full sm:w-fit" onClick={retry}>
        Tentar novamente
      </Button>
      <Link href="/dashboard" className="w-fit py-3 underline">
        Voltar para o Início
      </Link>
    </div>
  )
}
