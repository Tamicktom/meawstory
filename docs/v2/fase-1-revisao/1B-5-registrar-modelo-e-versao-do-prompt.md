# 1B-5 · Registrar modelo e versão do prompt em cada leitura

**Fase 1 · Etapa B — Dados da leitura e do exercício** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Permitir auditar mudanças de qualidade e reproduzir a configuração usada.

## Escopo
- Guardar identificador do modelo e versão imutável do prompt.
- Registrar esses dados em tentativas concluídas e com falha quando útil para diagnóstico.
- Usar os registros nos relatórios do conjunto de referência.
- Não expor identificadores técnicos na interface de quem escreve.

## Critérios de conclusão
- Toda leitura estruturada concluída pode ser associada à configuração exata que a produziu.
