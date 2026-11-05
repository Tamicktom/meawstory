# 1C-6 · Medir o custo por leitura

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Criar a base para rever limites e definir cota e preço sem estimativas inventadas.

## Escopo
- Medir consumo e custo da avaliação individual.
- Separar tentativas concluídas, refeitas por validação e com falha.
- Agregar custo por cena, versão, modelo e gênero quando houver volume.
- Registrar período e preço usados para permitir comparação histórica.

## Critérios de conclusão
- É possível calcular custo médio e distribuição por leitura concluída, incluindo o custo das tentativas descartadas.

## Dependências
- [1B-5 · Registrar modelo e versão do prompt em cada leitura](1B-5-registrar-modelo-e-versao-do-prompt.md)

## Observação
O custo da comparação é medido em 1H-1, no mesmo registro.
