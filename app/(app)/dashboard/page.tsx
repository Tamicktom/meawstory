//* Libraries imports
import Link from "next/link"

//* Components imports
import { buttonVariants } from "@/components/ui/button/button-variants"

export default function DashboardPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Início</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Escolha um exercício, escreva uma cena e receba uma leitura com base no
        que será observado nesse exercício.
      </p>
      <div className="flex flex-row flex-wrap gap-2">
        <Link
          id="dashboard-browse-themes"
          href="/dashboard/themes"
          className={buttonVariants({ className: "w-fit" })}
        >
          Explorar exercícios
        </Link>
        <Link
          id="dashboard-your-texts"
          href="/dashboard/texts"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Minhas cenas
        </Link>
      </div>
    </div>
  )
}
