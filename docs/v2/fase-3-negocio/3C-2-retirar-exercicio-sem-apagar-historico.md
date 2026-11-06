# 3C-2 · Retirar um exercício sem apagar o histórico

**Fase 3 · Etapa C — Administração do catálogo** · Tipo: Implementação · [Card pai](../00-card-pai.md)

> **Fora deste ciclo (2026-11-06).** Não se aplica. Não há administração do catálogo neste ciclo. O texto abaixo fica como registro.

## Objetivo
Remover conteúdo do catálogo ativo sem apagar cenas e leituras de quem já o praticou.

## Escopo
- Permitir retirar um exercício das sugestões e do catálogo de novas cenas.
- Preservar briefing e histórico para cenas existentes.
- Exibir “Este exercício saiu do catálogo. Sua cena e suas leituras continuam aqui.”
- Impedir exclusão em cascata de cenas pela retirada do exercício.
- Mudar a regra atual antes da implementação: hoje `database/schema.md` e o banco só permitem retirar um `theme` sem `text` ativo.

## Critérios de conclusão
- O exercício retirado não recebe novas cenas, enquanto todo o histórico anterior continua acessível.

## Dependências
- [3C-1 · Administrar o catálogo e as rubricas](3C-1-administrar-catalogo-e-rubricas.md)
