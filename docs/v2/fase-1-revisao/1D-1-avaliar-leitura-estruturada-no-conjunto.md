# 1D-1 · Avaliar a leitura estruturada no conjunto de referência

**Fase 1 · Etapa D — Portão de validação** · Tipo: Pesquisa · [Card pai](../00-card-pai.md)

## Objetivo
Só avançar para as telas depois de medir se o novo formato melhora a leitura.

## Escopo
- Comparar a configuração nova com a linha de base.
- Medir cobertura dos critérios, validade das citações e presença do foco.
- Medir consistência de faixas e ausência de ganho em revisão sem mudança real.
- Avaliar elogio vazio, tom respeitoso e ausência de reescrita.
- Definir tolerâncias a partir dos dados observados.

## Critérios de conclusão
- Os resultados estão registrados e a configuração atende aos limites definidos ou tem suas falhas bloqueantes explicitadas.

## Dependências
- [1A-2 · Medir a consistência da leitura atual](1A-2-medir-consistencia-da-leitura-atual.md)
- [1B-5 · Registrar modelo e versão do prompt em cada leitura](1B-5-registrar-modelo-e-versao-do-prompt.md)
- [1C-1 · Gerar a leitura estruturada por critério](1C-1-gerar-leitura-estruturada.md)
- [1C-2 · Calcular pontuação e faixas no servidor](1C-2-calcular-pontuacao-e-faixas-no-servidor.md)
- [1C-3 · Validar os trechos citados pela leitura](1C-3-validar-trechos-citados.md)
- [1C-4 · Proteger a leitura contra instruções dentro da cena](1C-4-proteger-leitura-contra-instrucoes-da-cena.md)

## Evidências

O método, as tolerâncias exploratórias, a comparação com a linha de base, a inspeção qualitativa e os bloqueios estão em [validação 1D](../validacao-1d/resultado.md). `bun run eval:gate <baseline anterior> <baseline estruturada>` recalcula a evidência quantitativa sem chamar a OpenAI. O andamento é registrado apenas no card pai; concluir a medição não significa que a configuração passou pelo portão.
