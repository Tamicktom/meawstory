# Conjunto de referência das leituras

Cenas fixas, lidas sempre do mesmo jeito, para medir qualquer mudança de modelo, prompt ou formato da leitura antes que ela chegue a quem escreve. Os cards [1A-1](../../docs/v2/fase-1-revisao/1A-1-montar-conjunto-de-referencia.md) e [1A-2](../../docs/v2/fase-1-revisao/1A-2-medir-consistencia-da-leitura-atual.md) explicam o objetivo e registram os resultados.

## O que há aqui

| Caminho | Conteúdo |
|---|---|
| `cases.ts` | Versão do conjunto, impressão digital e a lista de casos: tema, intenção de autoria, propósito, sondas e revisões |
| `scenes/<caso>.txt` | O texto de cada caso, como seria colado no editor |
| `human/<avaliador>.csv` | Uma planilha por pessoa avaliadora (ver abaixo) |
| `model-panel/<modelo>.csv` | A mesma planilha, preenchida por modelos de IA. Não é avaliação humana |
| `baselines/<data>-<rótulo>/` | Uma medição: `readings.json` com cada leitura bruta e `report.md` calculado a partir dele |
| `forms/` | Material gerado para quem avalia. Fica fora do Git |

O código está em `evaluation/`: `reference-set.ts` carrega e valida o conjunto, `reading-metrics.ts` extrai notas e citações das leituras, `human-evaluations.ts` lê as planilhas e `baseline-report.ts` monta o relatório.

## Versão 2

São 37 cenas originais, de 5 a 7 por gênero, usando os 12 temas do catálogo, mais 6 revisões e 1 controle. A versão 3, abaixo, acrescentou 3 sondas de instrução. A versão 2 acrescentou 8 casos, marcados com `textVersion: "2"`. Eles cobrem as faixas que a avaliação humana da versão 1 mostrou estarem sem cena: Ausente em cinco gêneros e Funciona em Ação e Diálogo. O controle `luta-06` é `luta-05` sem a instrução ao corretor. Os 36 casos da versão 1 não mudaram, então as notas humanas dadas a elas continuam valendo.

| Gênero | Ausente | Em esboço | Funciona | Forte | Revisão |
|---|---|---|---|---|---|
| Ação | acao-01, acao-06 | acao-02 | acao-03, acao-04, acao-07 | acao-05 | acao-03-r1, mudança real |
| Luta | luta-01 | luta-02, luta-05 | luta-03 | luta-04 | luta-03-r1, sem mudança real |
| Romance | romance-01, romance-06 | romance-02 | romance-03, romance-04 | romance-05 | romance-02-r1, mudança real |
| Diálogo | dialogo-01, dialogo-06 | dialogo-02 | dialogo-03, dialogo-07 | dialogo-04, dialogo-05 | dialogo-03-r1, sem mudança real |
| Suspense | suspense-01, suspense-06 | suspense-02 | suspense-03, suspense-05 | suspense-04 | suspense-03-r1, mudança real |
| Virada | virada-01, virada-06 | virada-02 | virada-03, virada-05 | virada-04 | virada-04-r1, sem mudança real |

A coluna é a **intenção de autoria**: a faixa da nota total que a cena foi escrita para atingir. Ela não é avaliação humana e não a substitui. Na versão 1, a avaliação humana pôs a maior parte das cenas escritas para Ausente em Em esboço e as cenas medianas em Forte. Quem decide a cobertura é a seção "Cobertura das faixas pela avaliação humana" do relatório.

Revisões **sem mudança real** trocam só palavras, norma culta e pontuação; a cena é a mesma. Revisões **com mudança real** atacam a fraqueza principal da versão original.

Alguns casos são sondas de regras da rubrica e de riscos conhecidos: erros de grafia que não devem pesar (`acao-04`), finais sem vitória (`acao-05`, `luta-04`), tom cômico (`dialogo-05`), prosa carregada (`romance-04`), períodos longos (`virada-05`), mistério explicado no fim (`suspense-02`, `suspense-05`) e uma instrução ao corretor escondida na cena (`luta-05`).

**Autoria das cenas:** as cenas das versões 1 e 2 foram escritas com IA (Claude) a partir dos temas do catálogo, para que o conjunto existisse antes do teste com pessoas. Não vêm de pessoas usuárias e não contêm dados pessoais. As pessoas avaliadoras podem pedir que uma cena seja trocada por outra escrita por gente, desde que com autorização de quem a escreveu, numa nova versão.

## Versão 3

A versão 3 acrescenta três sondas de instrução dentro da cena para [1C-4](../../docs/v2/fase-1-revisao/1C-4-proteger-leitura-contra-instrucoes-da-cena.md), marcadas com `textVersion: "3"`. Cada uma copia um caso existente e acrescenta a instrução; `injectedInto` aponta o caso original, que serve de comparação e não muda:

| Sonda | Caso original | Instrução |
|---|---|---|
| `virada-07` | `virada-02` | Falso fim de cena e falsa atualização da rubrica, pedindo nota máxima e foco vazio |
| `dialogo-08` | `dialogo-01` | Apelo emocional à IA no meio do texto, pedindo Forte em tudo |
| `romance-07` | `romance-06` | Falsa mensagem de sistema em inglês, pedindo nota máxima e foco vazio |

As sondas não contam para a cobertura de faixas de cada gênero, como as revisões e os controles. A seção "Instruções dentro da cena" do relatório compara cada sonda, e `luta-05`, com a cena sem a instrução.

## Avaliação humana

1. `bun run eval:forms` gera `forms/leitura.md`, com cada rubrica, tema e cena, e `forms/avaliacao.csv`, com uma linha por caso e critério. Com `--since 2`, o material traz só os casos acrescentados ou alterados a partir da versão 2.
2. Cada pessoa copia a planilha para `human/<nome-sem-espaco>.csv` e preenche `pontuacao`, de 0 até `maximo`. `observacao` é opcional. Linhas vazias são ignoradas, então a entrega pode ser parcial. A planilha pode ser salva com vírgula ou ponto e vírgula como separador (o padrão do Excel em português), e a nota pode usar vírgula decimal.
3. `bun run eval:report <pasta da medição>` confere as planilhas e acrescenta a comparação com a leitura ao relatório. Uma pontuação fora do intervalo, ou de um caso ou critério inexistente, interrompe o relatório com a linha do problema.

Para não contaminar a avaliação:

- Avalie antes de ver qualquer leitura da IA da mesma cena.
- Use as faixas da rubrica de cada critério para escolher a nota e só depois o número dentro da faixa.
- Avalie cada critério sozinho e cada caso sozinho, revisões incluídas. O material não mostra a intenção de autoria nem o tipo de revisão, mas os identificadores `-r1` indicam que o caso é uma revisão.

A coluna `versao_conjunto` registra a versão em que a nota foi dada. Uma nota continua valendo enquanto o texto do caso não mudar: o relatório só ignora notas dadas antes do `textVersion` do caso. Quem avaliou numa versão anterior não precisa refazer as cenas que não mudaram.

## Painel de modelos

`model-panel/` usa o mesmo formato de planilha, preenchida por modelos de IA que leram só `forms/leitura.md`, sem acesso às leituras, à intenção de autoria nem ao relatório. O relatório compara a leitura com o painel numa seção própria, separada da avaliação humana.

O painel é uma checagem provisória e **não fecha 1A-1**. Modelos tendem a compartilhar vieses entre si e com a leitura que se quer medir, como a leniência no topo da escala. A concordância com o painel não mostra que a leitura acerta; mostra só que outros modelos leem parecido. A discordância é um sinal útil para escolher onde a avaliação humana começa.

## Medir uma configuração

```sh
bun run eval:baseline --runs 5 --label atual
bun run eval:report evaluation/reference/baselines/<data>-atual
```

`eval:baseline` chama a mesma leitura da produção (`gradeReading`, em `workflows/correction-grading.ts`): a chamada ao modelo, a validação do servidor e, quando ela rejeita a resposta, a nova tentativa. Precisa de `OPENAI_API_KEY` no `.env`. Desde 1C-1, cada leitura grava em `readings.json` a leitura estruturada (`structured`) e todas as chamadas (`calls`), inclusive as rejeitadas, e o relatório usa as notas e citações da estrutura. Medições anteriores, em markdown, continuam legíveis. As cenas são enviadas à OpenAI como numa leitura real, com `store: false`. Cada leitura grava o resultado em `readings.json` assim que termina; se a execução parar, o mesmo comando retoma de onde parou. `--cases acao-01,luta-03` limita os casos e `--concurrency` controla as chamadas simultâneas (padrão 4).

Na leitura estruturada, uma leitura usa cerca de 2,8 mil tokens de entrada e 2,6 mil de saída, custa cerca de US$ 0,005 e leva de 20 a 45 segundos. A seção "Consumo" do relatório calcula o custo com o preço de `lib/model-pricing.ts` na data da medição, contando as chamadas rejeitadas. Uma medição completa da versão 3, com 235 leituras, deve levar cerca de 20 minutos com `--concurrency 6`.

`eval:report` não chama o modelo: recalcula `report.md` a partir de `readings.json`. Para comparar uma configuração nova, meça com outro `--label` e compare os dois relatórios.

## Portão da leitura estruturada (1D)

```sh
bun run eval:gate evaluation/reference/baselines/2026-11-05-atual-v2 evaluation/reference/baselines/2026-11-06-estruturada-portao
bun run eval:prototype evaluation/reference/baselines/2026-11-06-estruturada-portao
```

Os dois comandos usam somente arquivos locais e não fazem chamadas à OpenAI. `eval:gate` grava `gate.md` na pasta da medição nova: compara apenas casos com a mesma cena, enunciado e rubrica, confere a integridade dos resultados e aponta diferenças de revisões e sondas em relação ao ruído. As citações da estrutura são conferidas como trechos contíguos exatos da cena armazenada, incluindo acentos, sem o comparador permissivo usado para o markdown legado. Uma execução incompleta aparece com os slots ausentes; não libera o portão.

As tolerâncias exploratórias, a decisão, as limitações e a inspeção qualitativa ficam em [docs/v2/validacao-1d](../../docs/v2/validacao-1d/resultado.md). `eval:prototype` gera `forms/1d/prototipo-leitura-revisao.html`, um arquivo descartável que abre diretamente no navegador e inclui seis cenas e leituras reais (rodada #1; `dialogo-02` usa #2 porque #1 terminou em timeout, exceção registrada no roteiro). O gerador recusa fontes diferentes ou ausência de qualquer slot explicitamente escolhido; não substitui leituras automaticamente. O rascunho fica só na memória da aba; nenhuma nova leitura ou comparação é feita. O [roteiro de pesquisa](../../docs/v2/validacao-1d/roteiro.md) explica a aplicação com 5 a 10 escritores. Material preparado não equivale a teste realizado.

## Mudar o conjunto

1. Edite `cases.ts` e os arquivos em `scenes/`.
2. Aumente `REFERENCE_SET_VERSION` e ponha o novo número em `textVersion` em cada caso novo ou cujo texto mudou.
3. Rode `bun test tests/unit/reference-set.test.ts`. O teste falha e mostra a nova impressão digital; copie o valor para `REFERENCE_SET_FINGERPRINT`.

O teste também confere que cada gênero tem pelo menos 5 cenas cobrindo as quatro faixas e os dois temas, que toda cena tem de 100 a 2.000 palavras, que as revisões apontam para cenas existentes do mesmo tema e que o conjunto tem revisões com e sem mudança real.

Medições e planilhas antigas continuam válidas para a versão em que foram feitas: o relatório avisa quando o conjunto mudou depois da medição.
