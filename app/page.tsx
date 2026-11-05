//* Libraries imports
import type { Metadata } from "next"

//* Components imports
import { LandingPage } from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "Meawstory",
  description:
    "Escreva uma cena. Receba uma leitura honesta. Reescreva melhor.",
}

export default function Page() {
  return <LandingPage />
}
