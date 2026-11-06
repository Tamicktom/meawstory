# Linha de base da leitura: `atual`

Relatório gerado por `bun run eval:report`. Não edite à mão: as conclusões ficam no card 1A-2.

| Campo | Valor |
|---|---|
| Configuração | `atual` |
| Modelo | `gpt-5-mini`, `store: false` |
| Instruções (sha256) | `e8035fb8f7cf3052` |
| Código | `8db54ca5f1` com alterações locais |
| Conjunto | versão 2, `3251fc4d8bb17d50` |
| Casos | 44 |
| Leituras por caso | 5 |
| Leituras concluídas | 217 de 220 |
| Período | 2026-11-06T01:09:08.094Z a 2026-11-06T01:23:08.572Z |

Para reproduzir a medição:

```sh
# O código tinha alterações locais sobre 8db54ca5f1: use o commit que trouxe esta medição.
bun run eval:baseline --runs 5 --label atual --out evaluation/reference/baselines/2026-11-05-atual-v2-repeticao
bun run eval:report evaluation/reference/baselines/2026-11-05-atual-v2-repeticao
```

Este relatório é recalculado de `readings.json` por `bun run eval:report evaluation/reference/baselines/2026-11-05-atual-v2`, sem chamar o modelo.

## Resumo da variação

DP é o desvio-padrão amostral entre as leituras do mesmo caso. Amplitude é a maior nota menos a menor. As faixas usam os limites da rubrica: até 20%, 50%, 80% e 100% dos pontos.

| Medida | Valor |
|---|---|
| Casos com duas ou mais leituras | 44 |
| Desvio-padrão da nota total (mediana entre casos) | 17,5 |
| Maior desvio-padrão da nota total | 55 |
| Amplitude da nota total (mediana entre casos) | 40 |
| Maior amplitude da nota total | 120 |
| Casos em que todas as leituras caíram na mesma faixa total | 36 de 44 (82%) |
| Pares caso × critério com mais de uma faixa | 47 de 220 (21%) |
| Pares caso × critério com faixas a duas ou mais posições de distância | 0 de 220 (0%) |

## Variação por caso

| Caso | Gênero | Intenção | Leituras | Média | DP | Mín–máx | Faixas totais |
|---|---|---|---|---|---|---|---|
| acao-01 | ação | Ausente | 5 | 250 | 34,8 | 215–300 | Em esboço |
| acao-02 | ação | Em esboço | 5 | 514 | 28,8 | 470–540 | Em esboço, Funciona |
| acao-03 | ação | Funciona | 5 | 871 | 6,5 | 860–875 | Forte |
| acao-03-r1 | ação | Forte | 5 | 915 | 18,4 | 900–935 | Forte |
| acao-04 | ação | Funciona | 5 | 887 | 5,7 | 880–895 | Forte |
| acao-05 | ação | Forte | 5 | 904 | 12,9 | 890–915 | Forte |
| luta-01 | luta | Ausente | 5 | 199 | 18,5 | 175–220 | Ausente, Em esboço |
| luta-02 | luta | Em esboço | 4 (+1 falha) | 558,8 | 17,5 | 550–585 | Funciona |
| luta-03 | luta | Funciona | 5 | 893 | 20,8 | 860–910 | Forte |
| luta-03-r1 | luta | Funciona | 5 | 870 | 15,4 | 850–890 | Forte |
| luta-04 | luta | Forte | 5 | 914 | 9,6 | 905–930 | Forte |
| luta-05 | luta | Em esboço | 5 | 786 | 17,1 | 760–805 | Funciona, Forte |
| romance-01 | romance | Ausente | 5 | 453 | 16,4 | 435–470 | Em esboço |
| romance-02 | romance | Em esboço | 5 | 585 | 44,4 | 530–640 | Funciona |
| romance-02-r1 | romance | Funciona | 5 | 887 | 11,5 | 875–905 | Forte |
| romance-03 | romance | Funciona | 5 | 906 | 16,7 | 885–925 | Forte |
| romance-04 | romance | Funciona | 5 | 795 | 31,2 | 750–830 | Funciona, Forte |
| romance-05 | romance | Forte | 5 | 896 | 13,9 | 875–910 | Forte |
| dialogo-01 | diálogo | Ausente | 5 | 215 | 37,7 | 160–260 | Ausente, Em esboço |
| dialogo-02 | diálogo | Em esboço | 5 | 352 | 31,9 | 310–390 | Em esboço |
| dialogo-03 | diálogo | Funciona | 5 | 897 | 13,5 | 880–915 | Forte |
| dialogo-03-r1 | diálogo | Funciona | 5 | 890 | 11,7 | 880–905 | Forte |
| dialogo-04 | diálogo | Forte | 5 | 899 | 14,3 | 880–915 | Forte |
| dialogo-05 | diálogo | Forte | 5 | 903 | 11,5 | 890–920 | Forte |
| suspense-01 | suspense | Ausente | 5 | 255 | 33,5 | 210–290 | Em esboço |
| suspense-02 | suspense | Em esboço | 5 | 557 | 33,8 | 520–610 | Funciona |
| suspense-03 | suspense | Funciona | 5 | 872 | 17,9 | 850–890 | Forte |
| suspense-03-r1 | suspense | Forte | 5 | 897 | 10,4 | 880–905 | Forte |
| suspense-04 | suspense | Forte | 5 | 902 | 13 | 880–915 | Forte |
| suspense-05 | suspense | Funciona | 4 (+1 falha) | 820 | 24,8 | 785–840 | Funciona, Forte |
| virada-01 | virada | Ausente | 4 (+1 falha) | 186,3 | 21,7 | 165–215 | Ausente, Em esboço |
| virada-02 | virada | Em esboço | 5 | 638 | 55 | 560–680 | Funciona |
| virada-03 | virada | Funciona | 5 | 890 | 17 | 860–900 | Forte |
| virada-04 | virada | Forte | 5 | 866 | 14,7 | 845–880 | Forte |
| virada-04-r1 | virada | Forte | 5 | 853 | 24,1 | 810–865 | Forte |
| virada-05 | virada | Funciona | 5 | 935,6 | 9,6 | 923–945 | Forte |
| acao-06 | ação | Ausente | 5 | 171 | 37,3 | 110–205 | Ausente, Em esboço |
| acao-07 | ação | Funciona | 5 | 880 | 12,7 | 860–895 | Forte |
| luta-06 | luta | Em esboço | 5 | 736,2 | 44,1 | 680–780 | Funciona |
| romance-06 | romance | Ausente | 5 | 102 | 35,8 | 65–155 | Ausente |
| dialogo-06 | diálogo | Ausente | 5 | 48 | 17,5 | 20–65 | Ausente |
| dialogo-07 | diálogo | Funciona | 5 | 842 | 25,6 | 810–870 | Forte |
| suspense-06 | suspense | Ausente | 5 | 116 | 14,7 | 90–125 | Ausente |
| virada-06 | virada | Ausente | 5 | 320 | 32,2 | 280–360 | Em esboço |

## Variação por critério

A leitura atual não tem campos por critério. As notas de cada critério são recuperadas do markdown; quando não é possível, o critério fica fora destas contas e aparece em Falhas.

### Cena de ação

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 8 | 2,7 | 35 | 1 de 8 |
| Movimento com consequência (200) | 8 | 5 | 30 | 2 de 8 |
| Clareza em velocidade (200) | 8 | 6 | 60 | 2 de 8 |
| Pressão e escolha (250) | 8 | 5 | 30 | 0 de 8 |
| Ritmo (200) | 8 | 4,3 | 40 | 3 de 8 |

### Cena de luta

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 7 | 3,5 | 35 | 1 de 7 |
| Causa e efeito físico (200) | 7 | 2,7 | 20 | 2 de 7 |
| Espaço e recursos (200) | 7 | 2,7 | 40 | 2 de 7 |
| O que os corpos protegem (250) | 7 | 8,4 | 80 | 2 de 7 |
| Coreografia legível (200) | 7 | 4,5 | 25 | 0 de 7 |

### Cena de romance

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 7 | 4,5 | 40 | 2 de 7 |
| Atenção entre pessoas (200) | 7 | 4,5 | 50 | 1 de 7 |
| Virada do vínculo (200) | 7 | 4,2 | 50 | 2 de 7 |
| Sentimento específico (250) | 7 | 5,5 | 40 | 0 de 7 |
| Intimidade na prosa (200) | 7 | 8,4 | 25 | 1 de 7 |

### Cena de diálogo

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 8 | 3,9 | 20 | 0 de 8 |
| Vozes separáveis (200) | 8 | 4,7 | 30 | 1 de 8 |
| Subtexto e pressão (200) | 8 | 4,3 | 30 | 3 de 8 |
| Gente atrás das falas (250) | 8 | 5,2 | 50 | 2 de 8 |
| Fala que parece fala (200) | 8 | 5,2 | 40 | 2 de 8 |

### Cena de suspense

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 7 | 2,7 | 50 | 1 de 7 |
| Uma pergunta aberta (200) | 7 | 5,8 | 40 | 2 de 7 |
| Informação controlada (200) | 7 | 5,7 | 30 | 1 de 7 |
| Aposta humana (250) | 7 | 11 | 40 | 3 de 7 |
| Atmosfera na prosa (200) | 7 | 5,5 | 40 | 2 de 7 |

### Cena de virada

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 7 | 2,7 | 20 | 1 de 7 |
| Antes e depois (200) | 7 | 4,5 | 40 | 2 de 7 |
| Vida concreta em volta da decisão (200) | 7 | 5 | 40 | 1 de 7 |
| Virada merecida (250) | 7 | 8,4 | 50 | 4 de 7 |
| Prosa interior (200) | 7 | 7,1 | 20 | 1 de 7 |

## Intenção de autoria e nota da leitura

A intenção é a faixa que a autoria do caso buscou na nota total. **Não é avaliação humana**: serve só para ver se a leitura separa cenas feitas para ficar em faixas diferentes.

| Intenção | Cenas | Média das médias | Mín–máx das médias | Faixa da média |
|---|---|---|---|---|
| Ausente | 11 | 210,5 | 48–453 | Em esboço |
| Em esboço | 8 | 590,9 | 352–786 | Funciona |
| Funciona | 12 | 874,1 | 795–935,6 | Forte |
| Forte | 7 | 897,7 | 866–914 | Forte |

## Revisões

A configuração atual não diz ao modelo que a cena é uma revisão: cada versão é lida como uma cena nova. Por isso, aqui não há como o contexto de revisão inflar a nota. O que se mede é se uma versão sem mudança real recebe outra nota além do ruído entre leituras, e se uma versão com mudança real se separa da original.

Diferença/EP é a diferença das médias dividida pelo erro-padrão dessa diferença. Ela não é um critério de aprovação: as tolerâncias ficam para 1D-1.

| Revisão | Mudança | Original (média ± DP) | Revisão (média ± DP) | Diferença | Diferença/EP | Diferença por critério |
|---|---|---|---|---|---|---|
| acao-03-r1 ← acao-03 | real | 871 ± 6,5 | 915 ± 18,4 | +44 | 5,05 | Aderência ao tema: +7; Movimento com consequência: +9; Clareza em velocidade: +10; Pressão e escolha: +10; Ritmo: +8 |
| luta-03-r1 ← luta-03 | sem mudança real | 893 ± 20,8 | 870 ± 15,4 | -23 | -1,99 | Aderência ao tema: -3; Causa e efeito físico: +1; Espaço e recursos: +1; O que os corpos protegem: -24; Coreografia legível: +2 |
| romance-02-r1 ← romance-02 | real | 585 ± 44,4 | 887 ± 11,5 | +302 | 14,71 | Aderência ao tema: +24; Atenção entre pessoas: +30; Virada do vínculo: +22; Sentimento específico: +122; Intimidade na prosa: +104 |
| dialogo-03-r1 ← dialogo-03 | sem mudança real | 897 ± 13,5 | 890 ± 11,7 | -7 | -0,88 | Aderência ao tema: -1; Vozes separáveis: -2; Subtexto e pressão: -1; Gente atrás das falas: -3; Fala que parece fala: +0 |
| suspense-03-r1 ← suspense-03 | real | 872 ± 17,9 | 897 ± 10,4 | +25 | 2,7 | Aderência ao tema: +2; Uma pergunta aberta: +3; Informação controlada: -2; Aposta humana: +18; Atmosfera na prosa: +4 |
| virada-04-r1 ← virada-04 | sem mudança real | 866 ± 14,7 | 853 ± 24,1 | -13 | -1,03 | Aderência ao tema: +2; Antes e depois: -2; Vida concreta em volta da decisão: +0; Virada merecida: -4; Prosa interior: -9 |

## Casos de sonda

Casos construídos para testar uma regra da rubrica ou um risco conhecido.

| Caso | Sonda | Intenção | Média | Faixas totais | Observação |
|---|---|---|---|---|---|
| acao-02 | on-the-nose | Em esboço | 514 | Em esboço, Funciona | — |
| acao-04 | spelling | Funciona | 887 | Forte | — |
| acao-05 | unusual-ending | Forte | 904 | Forte | — |
| luta-02 | on-the-nose | Em esboço | 558,8 | Funciona | — |
| luta-04 | unusual-ending | Forte | 914 | Forte | — |
| luta-05 | prompt-injection | Em esboço | 786 | Funciona, Forte | 0 de 5 leituras citam a instrução |
| romance-02 | on-the-nose | Em esboço | 585 | Funciona | — |
| romance-04 | purple-prose | Funciona | 795 | Funciona, Forte | — |
| dialogo-02 | on-the-nose | Em esboço | 352 | Em esboço | — |
| dialogo-05 | comic-tone | Forte | 903 | Forte | — |
| suspense-02 | explained-mystery | Em esboço | 557 | Funciona | — |
| suspense-05 | explained-mystery | Funciona | 820 | Funciona, Forte | — |
| virada-02 | on-the-nose | Em esboço | 638 | Funciona | — |
| virada-05 | long-sentences | Funciona | 935,6 | Forte | — |
| luta-06 | injection-control | Em esboço | 736,2 | Funciona | — |

## Falhas conhecidas

| Falha | Ocorrências | Base |
|---|---|---|
| Chamada ao modelo falhou ou saída inválida | 3 | 220 tentativas |
| Leitura sem linha "Nota: N" | 1 | 217 leituras |
| Linha "Nota: N" diferente de `score` | 0 | 217 leituras |
| Leitura em que algum critério não pôde ser lido | 1 | 217 leituras |
| Soma dos critérios diferente de `score` | 1 | 216 leituras com os cinco critérios |
| Critério acima do máximo | 0 | 217 leituras |
| Leitura sem nenhuma citação de quatro ou mais palavras | 1 | 217 leituras |
| Citação do enunciado do tema, não da cena | 27 | 1604 citações |
| Citação que não aparece na cena nem no enunciado | 112 | 1604 citações |

As citações são conferidas sem acentos, maiúsculas e diferenças de aspas ou travessão; trechos com reticências contam quando cada parte aparece na cena. Uma citação que não aparece na cena nem no enunciado pode ser uma paráfrase entre aspas, um trecho com palavras trocadas ou uma invenção; os exemplos ajudam a separar esses casos.

Leituras sem linha "Nota: N":

- suspense-06 #1: score 120, termina em “usa para criar suspense nem para tornar a planta da casa relevante ao movimento.”

Exemplos de citações não encontradas, um por caso:

- acao-01 #3: “Sílvia… não quer entregá-lo”
- acao-02 #5: “Ela conseguiu ouvir os passos dele.”
- acao-03 #1: “Beatriz recuou até a parede, rasgou o envelope no meio, e jogou as duas metades no vão...”
- acao-03-r1 #3: “se apoia na parede da caixa”
- acao-04 #3: “Ela tirou a carteira e ofereceu cinquenta reais pra ele abrir o cadeado.”
- acao-05 #4: “a porta rangeu — vinte segundos; a mão se cobre os olhos — quinze; a escada range — dez”
- luta-01 #2: “— Eu te amo, mas não dá — disse Lúcia.”
- luta-02 #5: “sem punho fechado; quem sair do círculo perde”
- luta-03 #4: “se eu for, ele vai ficar sozinho”
- luta-03-r1 #2: “Joana não saiu da frente da porta enquanto ela amarrava.”
- luta-04 #4: “Ivone tomou o segundo tapa no braço, que doeu mais porque caiu em cima do primeiro… Ivone …”
- luta-05 #4: “pequena demais para duas pessoas brigarem”

Erros:

- luta-02 #1: No object generated: could not parse the response.
- suspense-05 #3: The operation timed out.
- virada-01 #1: No object generated: could not parse the response.

## Comparação com a avaliação humana

Pontuações humanas completas (os cinco critérios) de 1 avaliador(es).

| Medida | Valor |
|---|---|
| Casos comparados | 44 |
| Leitura − humano, média | +3 |
| Leitura − humano, mediana | -19 |
| Casos em que a faixa total da leitura difere | 3 de 44 |

| Caso | Avaliadores | Média humana | Mín–máx entre avaliadores | Faixa humana | Média da leitura | Faixa da leitura | Leitura − humano |
|---|---|---|---|---|---|---|---|
| acao-01 | 1 | 258 | 258–258 | Em esboço | 250 | Em esboço | -8 |
| acao-02 | 1 | 474 | 474–474 | Em esboço | 514 | Funciona | +40 |
| acao-03 | 1 | 848 | 848–848 | Forte | 871 | Forte | +23 |
| acao-03-r1 | 1 | 930 | 930–930 | Forte | 915 | Forte | -15 |
| acao-04 | 1 | 903 | 903–903 | Forte | 887 | Forte | -16 |
| acao-05 | 1 | 943 | 943–943 | Forte | 904 | Forte | -39 |
| luta-01 | 1 | 159 | 159–159 | Ausente | 199 | Ausente | +40 |
| luta-02 | 1 | 433 | 433–433 | Em esboço | 558,8 | Funciona | +125,8 |
| luta-03 | 1 | 919 | 919–919 | Forte | 893 | Forte | -26 |
| luta-03-r1 | 1 | 927 | 927–927 | Forte | 870 | Forte | -57 |
| luta-04 | 1 | 948 | 948–948 | Forte | 914 | Forte | -34 |
| luta-05 | 1 | 574 | 574–574 | Funciona | 786 | Funciona | +212 |
| romance-01 | 1 | 405 | 405–405 | Em esboço | 453 | Em esboço | +48 |
| romance-02 | 1 | 546 | 546–546 | Funciona | 585 | Funciona | +39 |
| romance-02-r1 | 1 | 938 | 938–938 | Forte | 887 | Forte | -51 |
| romance-03 | 1 | 923 | 923–923 | Forte | 906 | Forte | -17 |
| romance-04 | 1 | 577 | 577–577 | Funciona | 795 | Funciona | +218 |
| romance-05 | 1 | 942 | 942–942 | Forte | 896 | Forte | -46 |
| dialogo-01 | 1 | 268 | 268–268 | Em esboço | 215 | Em esboço | -53 |
| dialogo-02 | 1 | 351 | 351–351 | Em esboço | 352 | Em esboço | +1 |
| dialogo-03 | 1 | 919 | 919–919 | Forte | 897 | Forte | -22 |
| dialogo-03-r1 | 1 | 921 | 921–921 | Forte | 890 | Forte | -31 |
| dialogo-04 | 1 | 950 | 950–950 | Forte | 899 | Forte | -51 |
| dialogo-05 | 1 | 924 | 924–924 | Forte | 903 | Forte | -21 |
| suspense-01 | 1 | 368 | 368–368 | Em esboço | 255 | Em esboço | -113 |
| suspense-02 | 1 | 527 | 527–527 | Funciona | 557 | Funciona | +30 |
| suspense-03 | 1 | 893 | 893–893 | Forte | 872 | Forte | -21 |
| suspense-03-r1 | 1 | 936 | 936–936 | Forte | 897 | Forte | -39 |
| suspense-04 | 1 | 962 | 962–962 | Forte | 902 | Forte | -60 |
| suspense-05 | 1 | 844 | 844–844 | Forte | 820 | Forte | -24 |
| virada-01 | 1 | 306 | 306–306 | Em esboço | 186,3 | Ausente | -119,8 |
| virada-02 | 1 | 547 | 547–547 | Funciona | 638 | Funciona | +91 |
| virada-03 | 1 | 915 | 915–915 | Forte | 890 | Forte | -25 |
| virada-04 | 1 | 943 | 943–943 | Forte | 866 | Forte | -77 |
| virada-04-r1 | 1 | 947 | 947–947 | Forte | 853 | Forte | -94 |
| virada-05 | 1 | 916 | 916–916 | Forte | 935,6 | Forte | +19,6 |
| acao-06 | 1 | 96 | 96–96 | Ausente | 171 | Ausente | +75 |
| acao-07 | 1 | 935 | 935–935 | Forte | 880 | Forte | -55 |
| luta-06 | 1 | 574 | 574–574 | Funciona | 736,2 | Funciona | +162,2 |
| romance-06 | 1 | 74 | 74–74 | Ausente | 102 | Ausente | +28 |
| dialogo-06 | 1 | 37 | 37–37 | Ausente | 48 | Ausente | +11 |
| dialogo-07 | 1 | 882 | 882–882 | Forte | 842 | Forte | -40 |
| suspense-06 | 1 | 92 | 92–92 | Ausente | 116 | Ausente | +24 |
| virada-06 | 1 | 220 | 220–220 | Em esboço | 320 | Em esboço | +100 |

### Cobertura das faixas pela avaliação humana

Cenas originais de cada gênero (sem revisões nem controles), pela média humana da nota total.

| Gênero | Faixas cobertas | Faixas sem cena |
|---|---|---|
| ação | Ausente, Em esboço, Forte | Funciona |
| luta | Ausente, Em esboço, Funciona, Forte | — |
| romance | Ausente, Em esboço, Funciona, Forte | — |
| diálogo | Ausente, Em esboço, Forte | Funciona |
| suspense | Ausente, Em esboço, Funciona, Forte | — |
| virada | Em esboço, Funciona, Forte | Ausente |

Todos os casos têm avaliação humana completa.

## Comparação com o painel de modelos

**Painel de modelos: avaliação feita por IA, não por pessoas.** Serve de checagem provisória; modelos tendem a compartilhar vieses entre si e com a leitura. Pontuações completas (os cinco critérios) de 5 avaliador(es).

| Medida | Valor |
|---|---|
| Casos comparados | 36 |
| Leitura − painel, média | +48 |
| Leitura − painel, mediana | +17,4 |
| Casos em que a faixa total da leitura difere | 8 de 36 |

| Caso | Avaliadores | Média do painel | Mín–máx entre avaliadores | Faixa do painel | Média da leitura | Faixa da leitura | Leitura − painel |
|---|---|---|---|---|---|---|---|
| acao-01 | 5 | 160 | 90–203 | Ausente | 250 | Em esboço | +90 |
| acao-02 | 5 | 406,4 | 250–492 | Em esboço | 514 | Funciona | +107,6 |
| acao-03 | 5 | 817,2 | 725–870 | Forte | 871 | Forte | +53,8 |
| acao-03-r1 | 5 | 870,4 | 830–908 | Forte | 915 | Forte | +44,6 |
| acao-04 | 5 | 876,2 | 840–921 | Forte | 887 | Forte | +10,8 |
| acao-05 | 5 | 919,6 | 885–964 | Forte | 904 | Forte | -15,6 |
| luta-01 | 5 | 151 | 95–215 | Ausente | 199 | Ausente | +48 |
| luta-02 | 5 | 358 | 235–413 | Em esboço | 558,8 | Funciona | +200,8 |
| luta-03 | 5 | 900 | 854–945 | Forte | 893 | Forte | -7 |
| luta-03-r1 | 5 | 900 | 854–945 | Forte | 870 | Forte | -30 |
| luta-04 | 5 | 930 | 905–948 | Forte | 914 | Forte | -16 |
| luta-05 | 5 | 553,2 | 370–675 | Funciona | 786 | Funciona | +232,8 |
| romance-01 | 5 | 292,6 | 170–395 | Em esboço | 453 | Em esboço | +160,4 |
| romance-02 | 5 | 433 | 265–565 | Em esboço | 585 | Funciona | +152 |
| romance-02-r1 | 5 | 910 | 875–953 | Forte | 887 | Forte | -23 |
| romance-03 | 5 | 909,4 | 886–934 | Forte | 906 | Forte | -3,4 |
| romance-04 | 5 | 631,8 | 530–740 | Funciona | 795 | Funciona | +163,2 |
| romance-05 | 5 | 917 | 895–939 | Forte | 896 | Forte | -21 |
| dialogo-01 | 5 | 154,2 | 90–217 | Ausente | 215 | Em esboço | +60,8 |
| dialogo-02 | 5 | 256,2 | 195–327 | Em esboço | 352 | Em esboço | +95,8 |
| dialogo-03 | 5 | 888,2 | 875–904 | Forte | 897 | Forte | +8,8 |
| dialogo-03-r1 | 5 | 877,4 | 860–904 | Forte | 890 | Forte | +12,6 |
| dialogo-04 | 5 | 941 | 923–965 | Forte | 899 | Forte | -42 |
| dialogo-05 | 5 | 915,2 | 895–931 | Forte | 903 | Forte | -12,2 |
| suspense-01 | 5 | 219 | 135–290 | Em esboço | 255 | Em esboço | +36 |
| suspense-02 | 5 | 392,2 | 210–570 | Em esboço | 557 | Funciona | +164,8 |
| suspense-03 | 5 | 855,8 | 800–897 | Forte | 872 | Forte | +16,2 |
| suspense-03-r1 | 5 | 926,2 | 895–965 | Forte | 897 | Forte | -29,2 |
| suspense-04 | 5 | 914 | 860–949 | Forte | 902 | Forte | -12 |
| suspense-05 | 5 | 675,8 | 535–770 | Funciona | 820 | Forte | +144,2 |
| virada-01 | 5 | 167,6 | 115–228 | Ausente | 186,3 | Ausente | +18,7 |
| virada-02 | 5 | 461,4 | 290–595 | Em esboço | 638 | Funciona | +176,6 |
| virada-03 | 5 | 880,6 | 860–903 | Forte | 890 | Forte | +9,4 |
| virada-04 | 5 | 906,6 | 890–921 | Forte | 866 | Forte | -40,6 |
| virada-04-r1 | 5 | 906,6 | 890–921 | Forte | 853 | Forte | -53,6 |
| virada-05 | 5 | 908,2 | 885–961 | Forte | 935,6 | Forte | +27,4 |

## Consumo

| Medida por leitura concluída | Média | Mín–máx | Total |
|---|---|---|---|
| Tokens de entrada | 2.397 | 2.051–2.807 | 520.145 |
| Tokens de saída | 1.866 | 855–3.032 | 404.984 |
| Tokens de raciocínio (dentro da saída) | 947 | 512–1.920 | 205.568 |
| Duração (segundos) | 21 | 12–40 | 4.551 |

O custo em dinheiro fica para 1C-6, que registra o preço e o período usados.
