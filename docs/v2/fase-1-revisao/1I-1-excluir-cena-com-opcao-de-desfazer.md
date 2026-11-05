# 1I-1 · Excluir uma cena com opção de desfazer

**Fase 1 · Etapa I — Controle e medição** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Dar controle sobre o histórico sem tornar um clique acidental irreversível.

## Escopo
- Oferecer exclusão a partir de Minhas cenas e da própria cena.
- Aplicar as regras de soft delete e cascata já previstas no banco.
- Exibir “Cena excluída” e permitir desfazer por alguns segundos.
- Remover a cena das listas e sugestões enquanto estiver excluída.
- Preservar o histórico quando a exclusão for desfeita.
- Definir o que acontece quando a cena excluída tem uma leitura em andamento.

## Critérios de conclusão
- Desfazer restaura a cena e suas leituras.
- A exclusão definitiva segue as regras documentadas em `database/schema.md`.

## Dependências
- [0C-1 · Transformar a lista de textos em Minhas cenas](../fase-0-base/0C-1-transformar-lista-de-textos-em-minhas-cenas.md)
