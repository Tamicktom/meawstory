# 2B-2 · Registrar quando a leitura foi aberta

**Fase 2 · Etapa B — Histórico e encerramento** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Saber quais leituras prontas são novas, para marcá-las no Início e em Minhas cenas.

## Escopo
- Registrar a primeira abertura de cada leitura concluída.
- Não considerar aberta uma leitura apenas listada ou notificada.
- Tratar as leituras anteriores a esta entrega como já abertas.
- Registrar a regra em `database/schema.md` antes da migração.

## Critérios de conclusão
- Uma leitura pronta conta como nova até a primeira abertura.
- Abrir uma leitura não altera nada do que ela congelou.

## Dependências
- [1F-1 · Criar a tela da leitura estruturada](../fase-1-revisao/1F-1-criar-tela-da-leitura-estruturada.md)
