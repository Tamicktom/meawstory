# 3A-2 · Controlar a cota de leituras

**Fase 3 · Etapa A — Oferta e cota** · Tipo: Implementação · [Card pai](../00-card-pai.md)

> **Fora deste ciclo (2026-11-06).** Não se aplica. Não há cota de leituras de plano neste ciclo. Os limites de abuso da Fase 0 continuam valendo. O texto abaixo fica como registro.

## Objetivo
Controlar custo com previsibilidade e sem impedir a escrita.

## Escopo
- Descontar somente leituras concluídas, nunca tentativas com falha.
- Mostrar quantas leituras restam antes do envio.
- Ao esgotar, informar a data de renovação e manter o rascunho disponível.
- Impedir que novas tentativas burlem a cota.
- Aplicar regras distintas de plano sem alterar o histórico.

## Critérios de conclusão
- A cota exibida e a validada no servidor coincidem, e falhas não reduzem o saldo.

## Dependências
- [0C-5 · Limitar envios por pessoa](../fase-0-base/0C-5-limitar-envios-por-pessoa.md)
- [1E-7 · Criar a etapa de conferência antes do envio](../fase-1-revisao/1E-7-criar-etapa-de-conferencia-antes-do-envio.md)
- [3A-1 · Definir cota e versões do plano gratuito](3A-1-definir-cota-e-versoes-do-plano-gratuito.md)
