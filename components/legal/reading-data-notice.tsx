import { LegalLinks } from "@/components/legal/legal-links"

export function ReadingDataNotice() {
  return (
    <div className="flex flex-col gap-1 text-sm leading-relaxed text-muted-foreground">
      <p>
        Para gerar a leitura, sua cena é enviada à OpenAI. Pelos termos da API,
        ela não é usada para treinar modelos. A OpenAI pode mantê-la por até 30
        dias para monitorar abuso, ou por mais tempo quando a lei ou a proteção
        contra danos exigir.
      </p>
      <p>
        A cena e a leitura também ficam salvas no Meawstory e no serviço que
        processa a leitura. Não envie dados sensíveis ou conteúdo que você não
        tem autorização para compartilhar.
      </p>
      <LegalLinks newTab />
    </div>
  )
}
