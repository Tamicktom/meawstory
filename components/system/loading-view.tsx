import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingView({
  title = "Carregando a página",
}: {
  title?: string
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 p-4"
      aria-busy="true"
    >
      <h1 role="status" className="font-heading text-xl font-medium">
        {title}…
      </h1>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Link href="/dashboard" className="w-fit py-3 underline">
        Voltar para o Início
      </Link>
    </div>
  )
}
