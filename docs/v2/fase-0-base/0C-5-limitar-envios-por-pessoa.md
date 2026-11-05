# 0C-5 · Limitar envios por pessoa

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Controlar custo e abuso sem apagar o trabalho de quem atingir um limite.

## Escopo
- Aplicar o limite de leituras por pessoa e período definido em 0A-1.
- Proteger também contra muitos envios em pouco tempo.
- Informar quando será possível tentar novamente.
- Não contar tentativas de leitura que falharam.
- Manter a escrita e o rascunho disponíveis durante o bloqueio.

## Critérios de conclusão
- Envios acima do limite não iniciam leitura, e a interface informa o tempo de espera sem perder o texto.

## Observação
Uma leitura pode começar por dois caminhos: `POST /api/write/:themeId` e `POST /api/correction/start/:textId`, criado em 0B-6. O limite precisa valer nos dois.

## Dependências
- [0A-1 · Definir os limites iniciais de envio](0A-1-definir-limites-de-envio.md)
