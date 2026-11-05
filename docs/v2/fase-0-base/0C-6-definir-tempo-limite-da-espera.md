# 0C-6 · Definir tempo limite para a espera da leitura

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Encerrar a espera indefinida e orientar a pessoa quando a leitura demora.

## Escopo
- Definir o prazo esperado e o comportamento ao ultrapassá-lo.
- Exibir “Está levando mais tempo que o normal” sem apagar o texto enviado.
- Permitir sair e voltar depois por Minhas cenas.
- Distinguir atraso de falha definitiva para não oferecer a ação errada.

## Critérios de conclusão
- Toda espera sai do estado neutro após o prazo definido, com mensagem e próxima ação claras.

## Dependências
- [0C-1 · Transformar a lista de textos em Minhas cenas](0C-1-transformar-lista-de-textos-em-minhas-cenas.md)
- [0C-2 · Exibir cada estado da leitura](0C-2-exibir-estados-da-leitura.md)
