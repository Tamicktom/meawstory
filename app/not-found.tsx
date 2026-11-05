import Link from "next/link"
import { buttonVariants } from "@/components/ui/button/button-variants"

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col items-start gap-4 p-4">
      <h1 className="font-heading text-2xl font-medium">
        Página não encontrada
      </h1>
      <p>Esta página não existe ou não está disponível para sua conta.</p>
      <Link
        href="/dashboard"
        className={buttonVariants({ className: "min-h-11 w-full sm:w-fit" })}
      >
        Voltar para o Início
      </Link>
    </div>
  )
}
