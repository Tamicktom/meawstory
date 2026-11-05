# 1C-3 · Validar os trechos citados pela leitura

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Garantir que toda crítica tenha evidência literal na cena avaliada.

## Escopo
- Conferir no servidor se cada citação existe literalmente no texto congelado.
- Associar a citação ao critério correspondente.
- Escolher e registrar a regra para uma citação inexistente: refazer a leitura ou descartar o trecho.
- Não permitir comentário sem evidência no formato estruturado final.

## Critérios de conclusão
- Nenhuma leitura concluída exibe como citação um trecho que não pertence à cena.

## Dependências
- [1C-1 · Gerar a leitura estruturada por critério](1C-1-gerar-leitura-estruturada.md)
