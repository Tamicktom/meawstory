# 0A-1 · Definir os limites iniciais de envio

**Fase 0 · Etapa A — Decisões** · Tipo: Decisão · [Card pai](../00-card-pai.md)

## Objetivo
Fechar os limites que protegem a leitura e o custo antes de implementar as validações.

## Escopo
- Definir o mínimo e o máximo absolutos de palavras por envio.
- Definir o limite de leituras por pessoa e por período.
- Recomendação inicial do plano: de 100 a 2.000 palavras e até 10 leituras por dia.

## Critérios de conclusão
- Os limites e a periodicidade de revisão estão registrados e podem ser usados pelos cards de validação e limitação.

## Resultado

**Decisão tomada em 2026-11-04.**

| Limite | Valor | Card |
|---|---|---|
| Tamanho da cena | De 100 a 2.000 palavras por envio | 0C-4 |
| Leituras por pessoa | 10 em 24 horas móveis | 0C-5 |
| Envios em pouco tempo | 3 em 10 minutos móveis | 0C-5 |

**Regras de aplicação:**

- O servidor decide. A contagem de palavras na interface serve apenas para orientar a pessoa.
- Conta cada leitura iniciada da pessoa, exceto as que terminam em falha.
- Excluir uma cena não devolve leituras: a contagem inclui leituras de cenas excluídas.
- Uma leitura presa em andamento conta até o tempo limite de 0C-6 encerrá-la como falha.
- O tempo de espera informado vai até a leitura mais antiga dentro da janela sair dela.
- Estes limites protegem contra abuso. A cota do plano gratuito é outra decisão, tomada em 3A-1.

**Revisão:** depois de medir o custo em 1C-6 ou após 30 dias de uso real, o que vier primeiro.

**Custo estimado, ainda sem medição:** cerca de US$ 0,01 por leitura de 2.000 palavras e até US$ 0,15 por pessoa por dia no teto. A conta usa os preços do `gpt-5-mini` (US$ 0,25 por milhão de tokens de entrada e US$ 2,00 de saída, [tabela da OpenAI](https://developers.openai.com/api/docs/pricing), consultada em 2026-11-04), cerca de 6 mil tokens de entrada e de 3 a 6 mil de saída. Os tokens são uma suposição; 1C-6 traz o valor real.

**Registro de dados:** antes de implementar 0C-5, registrar em `database/schema.md` o que conta como leitura consumida.
