# 1B-3 · Estruturar o briefing do exercício

**Fase 1 · Etapa B — Dados da leitura e do exercício** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Tornar as partes do briefing dados usáveis, em vez de um único texto em markdown.

## Escopo
- Persistir situação, o que já é verdade, o que a cena precisa conter e o que a pessoa decide. Hoje essas partes só existem separadas no seed (`database/seed/themes.ts`), e o banco guarda o markdown renderizado.
- Guardar cada item de “o que a cena precisa conter” individualmente, para alimentar o checklist de 1E-5.
- Adicionar “O que não será penalizado” por exercício.
- Preencher esse conteúdo nos 12 exercícios atuais.
- Registrar as decisões em `database/schema.md` antes da migração.

## Critérios de conclusão
- O briefing e o checklist leem as partes sem interpretar markdown.
- Os 12 exercícios atuais têm todas as partes preenchidas.
