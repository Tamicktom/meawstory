# 1C-2 · Calcular pontuação e faixas no servidor

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Impedir que o total e a classificação dependam de contas feitas pela IA.

## Escopo
- Validar que cada pontuação respeita o máximo do critério.
- Somar o total no servidor.
- Calcular Ausente, Em esboço, Funciona e Forte a partir dos percentuais da rubrica.
- Manter a escala de 0 a 1000 no banco e a pontuação em segundo plano na interface.
- Rejeitar resposta que não cubra todos os critérios ou não traga foco.

## Critérios de conclusão
- O total salvo é sempre a soma dos critérios congelados.
- As faixas exibidas correspondem às pontuações e aos limites da rubrica.

## Dependências
- [1B-4 · Congelar critérios e pontuações em cada leitura](1B-4-congelar-criterios-em-cada-leitura.md)
- [1C-1 · Gerar a leitura estruturada por critério](1C-1-gerar-leitura-estruturada.md)
