# 1B-4 · Congelar critérios e pontuações em cada leitura

**Fase 1 · Etapa B — Dados da leitura e do exercício** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Preservar o histórico mesmo quando uma rubrica mudar depois.

## Escopo
- Guardar na leitura os critérios usados, pontuação máxima, pontuação obtida e faixa.
- Congelar também a evidência citada e os demais campos estruturados.
- Não recalcular leituras antigas com a rubrica atual.
- Definir que somente leituras concluídas representam versões; falhas não contam.
- Registrar as decisões em `database/schema.md` antes da migração.

## Critérios de conclusão
- Alterar uma rubrica não muda o conteúdo nem as pontuações de leituras já concluídas.

## Dependências
- [1B-1 · Estruturar a rubrica e criar sua versão pública](1B-1-estruturar-rubrica-e-versao-publica.md)
