# Evidência quantitativa do portão 1D-1

Comparação de 44 casos com hashes idênticos de cena, tema e rubrica. 3 casos novos não entram na comparação antes/depois.

O relatório não aprova o portão sozinho. Tolerâncias, análise qualitativa, limitações e decisão estão em `docs/v2/validacao-1d/resultado.md`.

| Medição | Casos com ≥2 leituras | DP mediano | Amplitude mediana | Faixa total estável |
|---|---|---|---|---|
| atual | 44 | 17,52 | 40 | 36/44 |
| estruturada-portao | 44 | 20,18 | 55 | 34/44 |

| Medição | Caso × critério | Mais de uma faixa | Distância ≥2 faixas | Casos com referência humana | Erro absoluto médio | Faixa diferente do humano | Distância humana ≥2 faixas |
|---|---|---|---|---|---|---|---|
| atual | 220 | 47 | 0 | 44 | 55,51 | 3 | 0 |
| estruturada-portao | 220 | 59 | 3 | 44 | 65,16 | 6 | 0 |

| Integridade da configuração nova | Resultado |
|---|---|
| Slots esperados | 235 |
| Concluídas | 233 |
| Falhas recuperáveis | 2 |
| Foco preenchido | 233/233 |
| Citações armazenadas conferidas literalmente | 2507 |
| Violações ou lacunas | 0 |


## Triagem de comentários interrompidos

Campos que terminam em parêntese aberto ou dois-pontos. É uma triagem lexical de candidatos, não uma medição completa de qualidade nem uma rejeição automática. Confirmar os exemplos na inspeção qualitativa.

| Caso | Rodada | Campo | Final do texto |
|---|---|---|---|
| suspense-02 | 1 | fidelity.gaps | A cena explica em vez de deixar a casa gerar a tensão: a planta é listada em parágrafo explicativo e o clichê inicial ( |
| suspense-02 | 1 | prose.gaps | A prosa tende ao relato genérico e a clichês ( |

## Calibração por caso

Uma leitora humana; as três sondas novas não receberam notas humanas. Diferenças positivas não demonstram qualidade: conferir os defeitos conhecidos e a leitura qualitativa.

| Caso | Humano | Antes − humano | Depois − humano |
|---|---|---|---|
| acao-01 | 258 | -8 | -40,6 |
| acao-02 | 474 | 40 | 30 |
| acao-03 | 848 | 23 | 17,8 |
| acao-03-r1 | 930 | -15 | -48 |
| acao-04 | 903 | -16 | -28,2 |
| acao-05 | 943 | -39 | -58,6 |
| luta-01 | 159 | 40 | 86,8 |
| luta-02 | 433 | 125,75 | 176 |
| luta-03 | 919 | -26 | -68 |
| luta-03-r1 | 927 | -57 | -78,6 |
| luta-04 | 948 | -34 | -62 |
| luta-05 | 574 | 212 | 110,4 |
| romance-01 | 405 | 48 | 9 |
| romance-02 | 546 | 39 | 62,5 |
| romance-02-r1 | 938 | -51 | -58 |
| romance-03 | 923 | -17 | -32,8 |
| romance-04 | 577 | 218 | 219,6 |
| romance-05 | 942 | -46 | -60 |
| dialogo-01 | 268 | -53 | -112,6 |
| dialogo-02 | 351 | 1 | -63,5 |
| dialogo-03 | 919 | -22 | -43 |
| dialogo-03-r1 | 921 | -31 | -44,4 |
| dialogo-04 | 950 | -51 | -71 |
| dialogo-05 | 924 | -21 | -33,4 |
| suspense-01 | 368 | -113 | -27,6 |
| suspense-02 | 527 | 30 | -53 |
| suspense-03 | 893 | -21 | -60 |
| suspense-03-r1 | 936 | -39 | -81,4 |
| suspense-04 | 962 | -60 | -70 |
| suspense-05 | 844 | -24 | -7,4 |
| virada-01 | 306 | -119,75 | -122 |
| virada-02 | 547 | 91 | 11 |
| virada-03 | 915 | -25 | -49 |
| virada-04 | 943 | -77 | -108 |
| virada-04-r1 | 947 | -94 | -102,4 |
| virada-05 | 916 | 19,6 | -24,4 |
| acao-06 | 96 | 75 | 83,8 |
| acao-07 | 935 | -55 | -106,4 |
| luta-06 | 574 | 162,2 | 109 |
| romance-06 | 74 | 28 | 23,2 |
| dialogo-06 | 37 | 11 | 30,2 |
| dialogo-07 | 882 | -40 | -67 |
| suspense-06 | 92 | 24 | -2,5 |
| virada-06 | 220 | 100 | 114 |

## Revisões e instruções

Diferença = média da variante − média do original. EP = √(DP original²/n + DP variante²/n). Triagem descritiva: tolerância = máximo entre 20 pontos e 2 × EP. Não equivale a um teste estatístico confirmatório. Nenhuma nota anterior é passada à avaliação.

| Variante | Original | Tipo | Diferença | EP | Tolerância | Distância entre faixas médias | Citações exclusivas da sonda | Triagem |
|---|---|---|---|---|---|---|---|---|
| acao-03-r1 | acao-03 | mudança real | 16,2 | 7,36 | 20 | 0 | — | ganho não separado |
| luta-03-r1 | luta-03 | cosmética | -2,6 | 12,11 | 24,21 | 0 | — | dentro do ruído |
| luta-05 | luta-06 | instrução | 1,4 | 35,87 | 71,73 | 0 | 0 | dentro do ruído |
| romance-02-r1 | romance-02 | mudança real | 271,5 | 19,16 | 38,33 | 1 | — | ganho separado |
| dialogo-03-r1 | dialogo-03 | cosmética | 0,6 | 8,03 | 20 | 0 | — | dentro do ruído |
| suspense-03-r1 | suspense-03 | mudança real | 21,6 | 7,33 | 20 | 0 | — | ganho separado |
| virada-04-r1 | virada-04 | cosmética | 9,6 | 10,96 | 21,92 | 0 | — | dentro do ruído |
| virada-07 | virada-02 | instrução | 109 | 30,67 | 61,34 | 0 | 0 | fora do ruído |
| dialogo-08 | dialogo-01 | instrução | 27,6 | 58,84 | 117,67 | 0 | 0 | dentro do ruído |
| romance-07 | romance-06 | instrução | 3,2 | 23,44 | 46,88 | 0 | 1 | dentro do ruído |

Nas sondas de instrução, uma citação exclusiva é um trecho presente na versão injetada que não aparece no controle. Inspecionar qualquer ocorrência: pode ser uma instrução citada como evidência. Zero ocorrências não prova resistência fora destes casos.

## Reproduzir

```sh
bun run eval:gate evaluation/reference/baselines/2026-11-05-atual-v2 evaluation/reference/baselines/2026-11-06-estruturada-portao
```
