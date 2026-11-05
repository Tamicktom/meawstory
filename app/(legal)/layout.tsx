import type { ReactNode } from "react"
import Link from "next/link"
import { LegalLinks } from "@/components/legal/legal-links"

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-5 py-6 [overflow-wrap:anywhere] sm:px-6">
      <header>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-heading text-lg font-medium"
        >
          Meawstory
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Atualizado em <time dateTime="2026-11-05">5 de novembro de 2026</time>
        </p>
        <article className="prose max-w-none dark:prose-invert">
          {children}
        </article>
      </main>
      <footer className="flex flex-col gap-2 border-t pt-4">
        <LegalLinks />
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center text-sm underline"
        >
          Voltar ao início
        </Link>
      </footer>
    </div>
  )
}
