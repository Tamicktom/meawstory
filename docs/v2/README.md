# Meawstory V2 — cards de execução

Estes cards dividem a proposta de `docs/produto-fluxo-novo.md` em entregas pequenas. **O andamento fica no [card pai](00-card-pai.md).**

## Fases

| Fase | Pasta | Objetivo | Cards |
|---|---|---|---|
| 0 — Corrigir a base | [`fase-0-base/`](fase-0-base/) | Uma pessoa consegue entrar e usar o ciclo atual sem encontrar estados falsos ou caminhos quebrados. | 25 |
| 1 — Ciclo de revisão | [`fase-1-revisao/`](fase-1-revisao/) | A pessoa escreve, lê, revisa e vê a diferença. É a fase que define o produto. | 33 |
| 2 — Motivo para voltar | [`fase-2-retorno/`](fase-2-retorno/) | Transformar exercícios soltos em prática contínua. | 20 |
| 3 — Sustentar o negócio | [`fase-3-negocio/`](fase-3-negocio/) | Operar com custo controlado, confiança e dados. | 8 |

## Como os cards se organizam

Cada fase é dividida em etapas, e a ordem entre elas está no card pai.

O ID indica a posição do card: em `1C-3`, `1` é a fase, `C` é a etapa e `3` é a ordem dentro da etapa. Os arquivos usam esse prefixo e por isso aparecem na ordem de execução. Depois que um card começar, mantenha o ID dele mesmo se a ordem mudar.

Todo card segue o mesmo formato: objetivo, escopo, critérios de conclusão e, quando existirem, dependências e observação.

| Tipo | O que entrega |
|---|---|
| Decisão | Uma escolha registrada, usada por outros cards |
| Pesquisa | Uma medição ou um teste, com resultado registrado |
| Implementação | Uma mudança no produto |
| Conteúdo | Texto, documentação ou catálogo |

## Regras de execução

- Um card só começa quando as dependências dele estiverem marcadas no card pai.
- O resultado de um card de decisão ou pesquisa é registrado no próprio card, em uma seção `## Resultado`.
- Decisões de dados são registradas em `database/schema.md` antes das respectivas mudanças de tabela ou consulta.
- Na Fase 1, o conjunto de referência, a medição e o teste com escritores (etapas A a D) vêm antes da construção completa da tela de leitura, da revisão e da comparação.

## Limites do plano

Não entram nestas etapas geração ou reescrita de cenas por IA, manuscritos longos, comunidade, ranking, medalhas, sequência de dias, exercícios gerados por IA ou avaliação humana como serviço.
