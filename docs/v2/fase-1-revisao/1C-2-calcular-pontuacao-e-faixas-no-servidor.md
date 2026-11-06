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

## Resultado

**Implementado em 2026-11-05.** O modelo não informa total nem faixa. O servidor:

- rejeita a resposta que não cobre exatamente os cinco critérios congelados (sem faltas, repetições ou critérios inventados) ou que não traz foco, leitura geral, ponto forte ou o que funciona e o que falta em cada critério;
- rejeita a pontuação fora de 0 até o máximo do critério, sem ajustá-la, e arredonda para centésimos;
- calcula a faixa de cada critério pelas faixas congeladas (30,01 de 150 já é Em esboço);
- soma o total, que vai para `score` na escala de 0 a 1000.

Uma resposta rejeitada é pedida de novo uma vez, com o motivo; a segunda rejeição encerra a tentativa como falha recuperável, na etapa `validation`. O serviço e o banco conferem de novo a soma e as faixas antes de gravar (`validateStructuredReading` e `valid_structured_reading`). Os dois casos da linha de base que gravariam nota errada, a leitura truncada e o erro de soma, deixam de ser possíveis: a primeira não cobre os critérios e o segundo não existe, porque o total não vem do modelo.

A pontuação continua em segundo plano no texto gerado: cada critério mostra primeiro a faixa e depois os pontos. A tela de 1F-1 decide a apresentação final.
