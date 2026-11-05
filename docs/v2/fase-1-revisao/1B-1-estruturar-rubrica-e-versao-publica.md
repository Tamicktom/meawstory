# 1B-1 · Estruturar a rubrica e criar sua versão pública

**Fase 1 · Etapa B — Dados da leitura e do exercício** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Separar as instruções destinadas à IA das informações que ajudam quem escreve.

## Escopo
- Persistir os cinco critérios, seus máximos e suas faixas como dados estruturados.
- Criar uma frase pública e simples para cada critério.
- Impedir que instruções internas de `rubric.content` apareçam na interface.
- Manter o vínculo entre exercício, gênero e rubrica.
- Registrar as decisões em `database/schema.md` antes da migração.

## Critérios de conclusão
- A IA recebe as instruções internas e o briefing recebe somente as descrições públicas, a partir da mesma rubrica.
