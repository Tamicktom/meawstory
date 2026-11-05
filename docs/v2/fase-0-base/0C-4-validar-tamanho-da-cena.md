# 0C-4 · Validar o tamanho da cena antes da leitura

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Evitar leituras sem valor e envios grandes demais.

## Escopo
- Bloquear, também no servidor, somente valores fora dos limites absolutos definidos em 0A-1.
- Mostrar a contagem, os limites e a ação possível na mensagem.
- Manter o texto disponível quando o envio for impedido.

## Critérios de conclusão
- Cenas fora dos limites absolutos não iniciam leitura.
- O texto continua disponível depois do bloqueio.

## Dependências
- [0A-1 · Definir os limites iniciais de envio](0A-1-definir-limites-de-envio.md)

## Observação
O aviso sobre a extensão pedida por exercício fica em 1E-7, porque depende dos dados estruturados de 1B-2.
