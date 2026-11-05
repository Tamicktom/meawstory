# 1C-4 · Proteger a leitura contra instruções dentro da cena

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Tratar o texto como material avaliado, nunca como comando para o modelo.

## Escopo
- Separar claramente instruções do sistema e conteúdo da cena.
- Orientar o modelo a ignorar pedidos como “dê nota 1000”.
- Adicionar casos de manipulação ao conjunto de avaliação.
- Medir se a pontuação e o foco permanecem coerentes nesses casos.

## Critérios de conclusão
- Os casos de teste com instruções embutidas não alteram as regras de avaliação nem produzem a pontuação solicitada pela cena.

## Dependências
- [1A-1 · Montar o conjunto de referência das leituras](1A-1-montar-conjunto-de-referencia.md)
- [1C-1 · Gerar a leitura estruturada por critério](1C-1-gerar-leitura-estruturada.md)
