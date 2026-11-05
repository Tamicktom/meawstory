# 0C-2 · Exibir cada estado da leitura

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Impedir que uma cena em processamento ou com falha pareça uma leitura concluída com nota zero.

## Escopo
- Criar apresentações distintas para aguardando, em andamento, concluída e com falha.
- Reservar a pontuação exclusivamente para leituras concluídas.
- Em falha, informar que o texto está salvo e que a tentativa não consome leitura.
- Em andamento, informar que é possível sair e encontrar a cena depois em Minhas cenas.

## Critérios de conclusão
- Nenhum estado incompleto exibe “Nota 0 de 1000” ou outro resultado inexistente.

## Dependências
- [0C-1 · Transformar a lista de textos em Minhas cenas](0C-1-transformar-lista-de-textos-em-minhas-cenas.md)
