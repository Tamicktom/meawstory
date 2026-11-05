//* Libraries imports
import Link from "next/link"

//* Components imports
import { buttonVariants } from "@/components/ui/button/button-variants"

//* Local imports
import { exampleReading } from "@/components/landing/example-reading"

const steps = [
  {
    title: "Escreva",
    description:
      "Escolha um exercício de ficção e escreva a cena do seu jeito, sem modelo para preencher.",
  },
  {
    title: "Leia",
    description:
      "A leitura percorre o que o exercício pede e aponta os trechos da sua cena em que cada ponto aparece.",
  },
  {
    title: "Revise",
    description:
      "Toda leitura termina com uma revisão concreta para tentar. O que mudar continua sendo decisão sua.",
  },
] as const

type LandingActionsProps = {
  startId: string
  signInId: string
}

function LandingActions(props: LandingActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link
        id={props.startId}
        href="/sign-up"
        className={buttonVariants({
          size: "lg",
          className: "h-11 px-5 text-sm",
        })}
      >
        Escrever minha primeira cena
      </Link>
      <Link
        id={props.signInId}
        href="/sign-in"
        className={buttonVariants({
          size: "lg",
          variant: "outline",
          className: "h-11 px-5 text-sm",
        })}
      >
        Já tenho conta
      </Link>
    </div>
  )
}

function ExampleReading() {
  return (
    <section
      aria-labelledby="landing-example-title"
      className="border-y bg-muted/40"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <div className="flex max-w-2xl flex-col gap-2">
          <h2
            id="landing-example-title"
            className="font-heading text-2xl font-medium"
          >
            Uma leitura de verdade
          </h2>
          <p className="text-muted-foreground">
            Trechos de uma leitura gerada pelo Meawstory para uma cena de
            demonstração do exercício “{exampleReading.exerciseTitle}”.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <figure className="flex flex-col gap-3">
            <figcaption className="text-sm font-medium text-muted-foreground">
              Final da cena
            </figcaption>
            <blockquote className="flex flex-col gap-4 border-l-2 border-primary pl-5 font-heading text-lg leading-relaxed">
              {exampleReading.sceneExcerpt.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </blockquote>
          </figure>
          <div className="flex flex-col gap-6 text-sm leading-relaxed">
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-muted-foreground">
                Leitura geral
              </h3>
              <p>{exampleReading.opening}</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-muted-foreground">
                {exampleReading.criterion.name} —{" "}
                {exampleReading.criterion.score}
              </h3>
              <p>{exampleReading.criterion.comment}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-primary/15 p-4">
              <h3 className="font-medium">Revisão sugerida</h3>
              <p>{exampleReading.revision}</p>
            </div>
            <p className="text-muted-foreground">
              Pontuação da cena: {exampleReading.totalScore}. Esta é uma leitura
              de IA. Ela serve para treinar e não define o valor da sua escrita.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function LandingPage() {
  return (
    <div lang="pt-BR" className="flex min-h-svh flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 pt-6">
        <p className="font-heading text-lg font-medium">Meawstory</p>
      </header>
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16 md:py-24">
          <h1 className="max-w-3xl font-heading text-4xl leading-tight font-medium text-balance md:text-5xl">
            Escreva uma cena. Receba uma leitura honesta. Reescreva melhor.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Um lugar para treinar ficção: você escreve a partir de um exercício
            e recebe uma leitura crítica apoiada no seu próprio texto.
          </p>
          <LandingActions startId="landing-start" signInId="landing-sign-in" />
        </section>
        <ExampleReading />
        <section
          aria-labelledby="landing-steps-title"
          className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16"
        >
          <h2
            id="landing-steps-title"
            className="font-heading text-2xl font-medium"
          >
            Como funciona
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2">
                <span className="font-heading text-3xl text-muted-foreground">
                  {index + 1}
                </span>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16">
            <h2 className="max-w-3xl font-heading text-3xl font-medium text-balance">
              A IA não escreve por você. Seu texto continua seu.
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              A leitura aponta o que funciona e o que falta, mas não reescreve a
              sua cena.
            </p>
            <LandingActions
              startId="landing-start-bottom"
              signInId="landing-sign-in-bottom"
            />
          </div>
        </section>
      </main>
      <footer className="border-t">
        <p className="mx-auto w-full max-w-5xl px-6 py-8 text-xs leading-relaxed text-muted-foreground">
          Para gerar a leitura, sua cena é enviada à OpenAI. Pelos termos da
          API, ela não é usada para treinar modelos. A OpenAI pode mantê-la por
          até 30 dias para monitorar abuso, ou por mais tempo quando a lei ou a
          proteção contra danos exigir.
        </p>
      </footer>
    </div>
  )
}

export { LandingPage }
