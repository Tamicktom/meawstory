# 1C-5 · Monitorar erros e operação da leitura

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Sustentar o teste com escritores e identificar falhas antes que pareçam perda de texto.

## Escopo
- Escolher a ferramenta de monitoramento.
- Monitorar erros da aplicação, API e workflows.
- Medir tempo até a leitura e taxa de falha.
- Distinguir fila, processamento, atraso e falha definitiva.
- Relacionar erros ao modelo e à versão do prompt sem expor dados técnicos na interface.
- Alertar sobre aumento anormal de falhas ou duração.

## Critérios de conclusão
- Uma falha pode ser localizada por etapa e o tempo e a taxa de falha podem ser acompanhados ao longo do tempo.

## Dependências
- [0C-6 · Definir tempo limite para a espera da leitura](../fase-0-base/0C-6-definir-tempo-limite-da-espera.md)
- [1B-5 · Registrar modelo e versão do prompt em cada leitura](1B-5-registrar-modelo-e-versao-do-prompt.md)
