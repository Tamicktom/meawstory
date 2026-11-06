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

## Resultado

**Implementado em 2026-11-05.** Cada chamada ao modelo vira uma linha em `reading_call`: aceita, rejeitada pela validação ou com erro do provedor, com tokens de entrada, de cache, de saída e de raciocínio, o preço em vigor naquele dia e o custo em dólares. O custo fica nulo quando o provedor não informa o uso; ele nunca conta como zero.

**Preço registrado:** `gpt-5-mini`, US$ 0,25 por milhão de tokens de entrada, US$ 0,025 em cache e US$ 2,00 de saída (os tokens de raciocínio são cobrados como saída), conforme a [página do modelo na OpenAI](https://developers.openai.com/api/docs/models/gpt-5-mini), conferida em 2026-11-05. A tabela fica em `lib/model-pricing.ts`; uma mudança de preço entra como nova linha com a data de início, e cada chamada guarda o preço com que foi calculada.

`bun run ops:report` calcula, para o período escolhido:

- o custo médio por leitura concluída, somando as tentativas descartadas (rejeitadas, com erro e as que falharam);
- a distribuição do custo próprio de cada leitura concluída (média, p50, p90 e máximo);
- o custo por resultado da chamada, por modelo, por versão do prompt, por gênero e as cenas mais caras.

"Versão" aqui é a versão do prompt; o custo por versão da cena entra quando 1G-1 criar as versões. O relatório da linha de base também calcula o custo com o mesmo preço, para comparar configurações antes de chegarem ao produto.
