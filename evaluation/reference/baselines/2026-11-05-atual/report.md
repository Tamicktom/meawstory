# Linha de base da leitura: `atual`

Relatório gerado por `bun run eval:report`. Não edite à mão: as conclusões ficam no card 1A-2.

| Campo | Valor |
|---|---|
| Configuração | `atual` |
| Modelo | `gpt-5-mini`, `store: false` |
| Instruções (sha256) | `e8035fb8f7cf3052` |
| Código | `8db54ca5f1` com alterações locais |
| Conjunto | versão 1, `25f123a64fda9e2a` |
| Casos | 36 |
| Leituras por caso | 5 |
| Leituras concluídas | 180 de 180 |
| Período | 2026-11-06T00:14:48.798Z a 2026-11-06T00:24:57.782Z |

> **Atenção:** o conjunto mudou depois desta medição (versão 1 medida, versão 2 atual). As citações foram conferidas contra os textos atuais.

Para reproduzir a medição:

```sh
# O código tinha alterações locais sobre 8db54ca5f1: use o commit que trouxe esta medição.
bun run eval:baseline --runs 5 --label atual --out evaluation/reference/baselines/2026-11-05-atual-repeticao
bun run eval:report evaluation/reference/baselines/2026-11-05-atual-repeticao
```

Este relatório é recalculado de `readings.json` por `bun run eval:report evaluation/reference/baselines/2026-11-05-atual`, sem chamar o modelo.

## Resumo da variação

DP é o desvio-padrão amostral entre as leituras do mesmo caso. Amplitude é a maior nota menos a menor. As faixas usam os limites da rubrica: até 20%, 50%, 80% e 100% dos pontos.

| Medida | Valor |
|---|---|
| Casos com duas ou mais leituras | 36 |
| Desvio-padrão da nota total (mediana entre casos) | 18 |
| Maior desvio-padrão da nota total | 220,4 |
| Amplitude da nota total (mediana entre casos) | 42,5 |
| Maior amplitude da nota total | 520 |
| Casos em que todas as leituras caíram na mesma faixa total | 28 de 36 (78%) |
| Pares caso × critério com mais de uma faixa | 36 de 180 (20%) |
| Pares caso × critério com faixas a duas ou mais posições de distância | 1 de 180 (1%) |

## Variação por caso

| Caso | Gênero | Intenção | Leituras | Média | DP | Mín–máx | Faixas totais |
|---|---|---|---|---|---|---|---|
| acao-01 | ação | Ausente | 5 | 242 | 18,2 | 220–260 | Em esboço |
| acao-02 | ação | Em esboço | 5 | 499 | 15,2 | 485–520 | Em esboço, Funciona |
| acao-03 | ação | Funciona | 5 | 890 | 17,7 | 875–920 | Forte |
| acao-03-r1 | ação | Forte | 5 | 903 | 17,5 | 885–925 | Forte |
| acao-04 | ação | Funciona | 5 | 878,4 | 25,2 | 845–915 | Forte |
| acao-05 | ação | Forte | 5 | 907,4 | 15,6 | 882–920 | Forte |
| luta-01 | luta | Ausente | 5 | 234 | 50,9 | 185–310 | Ausente, Em esboço |
| luta-02 | luta | Em esboço | 5 | 518 | 57,2 | 430–560 | Em esboço, Funciona |
| luta-03 | luta | Funciona | 5 | 869 | 15,2 | 850–890 | Forte |
| luta-03-r1 | luta | Funciona | 5 | 881 | 23,8 | 845–905 | Forte |
| luta-04 | luta | Forte | 5 | 909 | 7,4 | 900–920 | Forte |
| luta-05 | luta | Em esboço | 5 | 785,6 | 6,3 | 775–790 | Funciona |
| romance-01 | romance | Ausente | 5 | 388 | 40,7 | 320–425 | Em esboço |
| romance-02 | romance | Em esboço | 5 | 503 | 220,4 | 110–630 | Ausente, Funciona |
| romance-02-r1 | romance | Funciona | 5 | 886,4 | 4,7 | 880–892 | Forte |
| romance-03 | romance | Funciona | 5 | 899 | 17,1 | 875–920 | Forte |
| romance-04 | romance | Funciona | 5 | 803 | 18,2 | 775–825 | Funciona, Forte |
| romance-05 | romance | Forte | 5 | 907 | 9,1 | 895–915 | Forte |
| dialogo-01 | diálogo | Ausente | 5 | 215 | 62,3 | 115–285 | Ausente, Em esboço |
| dialogo-02 | diálogo | Em esboço | 5 | 347 | 27,5 | 310–370 | Em esboço |
| dialogo-03 | diálogo | Funciona | 5 | 880,2 | 8,2 | 870–891 | Forte |
| dialogo-03-r1 | diálogo | Funciona | 5 | 894 | 11,4 | 875–905 | Forte |
| dialogo-04 | diálogo | Forte | 5 | 896,6 | 17,5 | 880–920 | Forte |
| dialogo-05 | diálogo | Forte | 5 | 917 | 12 | 900–930 | Forte |
| suspense-01 | suspense | Ausente | 5 | 244 | 36 | 180–265 | Ausente, Em esboço |
| suspense-02 | suspense | Em esboço | 5 | 571 | 26,6 | 540–610 | Funciona |
| suspense-03 | suspense | Funciona | 5 | 865 | 18,4 | 835–885 | Forte |
| suspense-03-r1 | suspense | Forte | 5 | 892 | 16 | 870–905 | Forte |
| suspense-04 | suspense | Forte | 5 | 907 | 11,5 | 890–920 | Forte |
| suspense-05 | suspense | Funciona | 5 | 822 | 24,6 | 790–850 | Funciona, Forte |
| virada-01 | virada | Ausente | 5 | 178 | 29,5 | 130–200 | Ausente |
| virada-02 | virada | Em esboço | 5 | 700 | 23,7 | 670–730 | Funciona |
| virada-03 | virada | Funciona | 5 | 883 | 15,2 | 865–900 | Forte |
| virada-04 | virada | Forte | 5 | 850 | 19 | 830–870 | Forte |
| virada-04-r1 | virada | Forte | 5 | 864 | 18,5 | 845–890 | Forte |
| virada-05 | virada | Funciona | 5 | 945 | 11,7 | 935–960 | Forte |

## Variação por critério

A leitura atual não tem campos por critério. As notas de cada critério são recuperadas do markdown; quando não é possível, o critério fica fora destas contas e aparece em Falhas.

### Cena de ação

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 5,5 | 25 | 1 de 6 |
| Movimento com consequência (200) | 6 | 5 | 15 | 0 de 6 |
| Clareza em velocidade (200) | 6 | 7,1 | 30 | 1 de 6 |
| Pressão e escolha (250) | 6 | 5,5 | 40 | 1 de 6 |
| Ritmo (200) | 6 | 5,1 | 23 | 0 de 6 |

### Cena de luta

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 3,7 | 15 | 0 de 6 |
| Causa e efeito físico (200) | 6 | 4,3 | 40 | 2 de 6 |
| Espaço e recursos (200) | 6 | 4,5 | 30 | 0 de 6 |
| O que os corpos protegem (250) | 6 | 18,6 | 80 | 4 de 6 |
| Coreografia legível (200) | 6 | 5 | 40 | 1 de 6 |

### Cena de romance

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 3,1 | 50 | 2 de 6 |
| Atenção entre pessoas (200) | 6 | 3,1 | 30 | 1 de 6 |
| Virada do vínculo (200) | 6 | 4,9 | 50 | 2 de 6 |
| Sentimento específico (250) | 6 | 7,7 | 50 | 2 de 6 |
| Intimidade na prosa (200) | 6 | 4,3 | 10 | 0 de 6 |

### Cena de diálogo

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 2,7 | 25 | 1 de 6 |
| Vozes separáveis (200) | 6 | 3,9 | 20 | 1 de 6 |
| Subtexto e pressão (200) | 6 | 5,9 | 40 | 2 de 6 |
| Gente atrás das falas (250) | 6 | 5,5 | 100 | 1 de 6 |
| Fala que parece fala (200) | 6 | 5 | 20 | 0 de 6 |

### Cena de suspense

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 2,7 | 40 | 2 de 6 |
| Uma pergunta aberta (200) | 6 | 4,3 | 50 | 1 de 6 |
| Informação controlada (200) | 6 | 4,7 | 30 | 1 de 6 |
| Aposta humana (250) | 6 | 9,9 | 40 | 4 de 6 |
| Atmosfera na prosa (200) | 6 | 5,4 | 40 | 2 de 6 |

### Cena de virada

| Critério (máximo) | Casos lidos | DP mediano | Maior amplitude | Casos com mais de uma faixa |
|---|---|---|---|---|
| Aderência ao tema (150) | 6 | 3,5 | 15 | 1 de 6 |
| Antes e depois (200) | 6 | 3,6 | 30 | 1 de 6 |
| Vida concreta em volta da decisão (200) | 6 | 5 | 50 | 1 de 6 |
| Virada merecida (250) | 6 | 7 | 40 | 1 de 6 |
| Prosa interior (200) | 6 | 6,3 | 30 | 0 de 6 |

## Intenção de autoria e nota da leitura

A intenção é a faixa que a autoria do caso buscou na nota total. **Não é avaliação humana**: serve só para ver se a leitura separa cenas feitas para ficar em faixas diferentes.

| Intenção | Cenas | Média das médias | Mín–máx das médias | Faixa da média |
|---|---|---|---|---|
| Ausente | 6 | 250,2 | 178–388 | Em esboço |
| Em esboço | 7 | 560,5 | 347–785,6 | Funciona |
| Funciona | 10 | 873,5 | 803–945 | Forte |
| Forte | 7 | 899,1 | 850–917 | Forte |

## Revisões

A configuração atual não diz ao modelo que a cena é uma revisão: cada versão é lida como uma cena nova. Por isso, aqui não há como o contexto de revisão inflar a nota. O que se mede é se uma versão sem mudança real recebe outra nota além do ruído entre leituras, e se uma versão com mudança real se separa da original.

Diferença/EP é a diferença das médias dividida pelo erro-padrão dessa diferença. Ela não é um critério de aprovação: as tolerâncias ficam para 1D-1.

| Revisão | Mudança | Original (média ± DP) | Revisão (média ± DP) | Diferença | Diferença/EP | Diferença por critério |
|---|---|---|---|---|---|---|
| acao-03-r1 ← acao-03 | real | 890 ± 17,7 | 903 ± 17,5 | +13 | 1,17 | Aderência ao tema: -1; Movimento com consequência: +5; Clareza em velocidade: +7; Pressão e escolha: +0; Ritmo: +2 |
| luta-03-r1 ← luta-03 | sem mudança real | 869 ± 15,2 | 881 ± 23,8 | +12 | 0,95 | Aderência ao tema: +1; Causa e efeito físico: +6; Espaço e recursos: +3; O que os corpos protegem: +2; Coreografia legível: +0 |
| romance-02-r1 ← romance-02 | real | 503 ± 220,4 | 886,4 ± 4,7 | +383,4 | 3,89 | Aderência ao tema: +16,4; Atenção entre pessoas: +30; Virada do vínculo: +27,3; Sentimento específico: +113,5; Intimidade na prosa: +101,5 |
| dialogo-03-r1 ← dialogo-03 | sem mudança real | 880,2 ± 8,2 | 894 ± 11,4 | +13,8 | 2,19 | Aderência ao tema: +3,8; Vozes separáveis: +1; Subtexto e pressão: +4; Gente atrás das falas: +2; Fala que parece fala: +3 |
| suspense-03-r1 ← suspense-03 | real | 865 ± 18,4 | 892 ± 16 | +27 | 2,48 | Aderência ao tema: +0; Uma pergunta aberta: +4; Informação controlada: +5; Aposta humana: +16; Atmosfera na prosa: +2 |
| virada-04-r1 ← virada-04 | sem mudança real | 850 ± 19 | 864 ± 18,5 | +14 | 1,18 | Aderência ao tema: +0; Antes e depois: +3; Vida concreta em volta da decisão: +3; Virada merecida: +2; Prosa interior: +6 |

## Casos de sonda

Casos construídos para testar uma regra da rubrica ou um risco conhecido.

| Caso | Sonda | Intenção | Média | Faixas totais | Observação |
|---|---|---|---|---|---|
| acao-02 | on-the-nose | Em esboço | 499 | Em esboço, Funciona | — |
| acao-04 | spelling | Funciona | 878,4 | Forte | — |
| acao-05 | unusual-ending | Forte | 907,4 | Forte | — |
| luta-02 | on-the-nose | Em esboço | 518 | Em esboço, Funciona | — |
| luta-04 | unusual-ending | Forte | 909 | Forte | — |
| luta-05 | prompt-injection | Em esboço | 785,6 | Funciona | 0 de 5 leituras citam a instrução |
| romance-02 | on-the-nose | Em esboço | 503 | Ausente, Funciona | — |
| romance-04 | purple-prose | Funciona | 803 | Funciona, Forte | — |
| dialogo-02 | on-the-nose | Em esboço | 347 | Em esboço | — |
| dialogo-05 | comic-tone | Forte | 917 | Forte | — |
| suspense-02 | explained-mystery | Em esboço | 571 | Funciona | — |
| suspense-05 | explained-mystery | Funciona | 822 | Funciona, Forte | — |
| virada-02 | on-the-nose | Em esboço | 700 | Funciona | — |
| virada-05 | long-sentences | Funciona | 945 | Forte | — |

## Falhas conhecidas

| Falha | Ocorrências | Base |
|---|---|---|
| Chamada ao modelo falhou ou saída inválida | 0 | 180 tentativas |
| Leitura sem linha "Nota: N" | 1 | 180 leituras |
| Linha "Nota: N" diferente de `score` | 0 | 180 leituras |
| Leitura em que algum critério não pôde ser lido | 1 | 180 leituras |
| Soma dos critérios diferente de `score` | 0 | 179 leituras com os cinco critérios |
| Critério acima do máximo | 0 | 180 leituras |
| Leitura sem nenhuma citação de quatro ou mais palavras | 0 | 180 leituras |
| Citação do enunciado do tema, não da cena | 25 | 1325 citações |
| Citação que não aparece na cena nem no enunciado | 93 | 1325 citações |

As citações são conferidas sem acentos, maiúsculas e diferenças de aspas ou travessão; trechos com reticências contam quando cada parte aparece na cena. Uma citação que não aparece na cena nem no enunciado pode ser uma paráfrase entre aspas, um trecho com palavras trocadas ou uma invenção; os exemplos ajudam a separar esses casos.

Leituras sem linha "Nota: N":

- romance-02 #4: score 110, termina em “é dito duas vezes" não aparece com clareza; o texto registra um quase‑discurso (”

Exemplos de citações não encontradas, um por caso:

- acao-02 #3: “Ela olhou para trás e viu o Caio.”
- acao-03-r1 #4: “Jordana deixou a caixa-d'água para trás e andou pelo beiral... Beatriz deu a volta pelo ou…”
- acao-04 #4: “Ela tirou a carteira e ofereceu cinquenta reais pra ele abrir o cadeado.”
- acao-05 #2: “um passo. a porta rangeu. dois passos.”
- luta-01 #4: “A cozinha era pequena e a geladeira fazia um barulho baixo. A porta abriu para dentro”
- luta-02 #4: “O Dênis deu um soco. O Paulão deu um soco. O Dênis deu um chute.”
- luta-03 #5: “Helena puxou Joana pela gola para o lado, na direção do fogão, e o cotovelo de Joana bateu…”
- luta-03-r1 #5: “Helena segurou o braço dela pelo cotovelo e puxou… Helena tropeçou na cadeira de plástico……”
- luta-04 #3: “o braço esquerdo latejava, como se uma corda puxasse o ombro para baixo, e cada elevação f…”
- luta-05 #4: “Ele tentou pegar a panela. Elisa desviou e ele bateu a mão na pia. Ele gritou de dor.”
- romance-01 #5: “Então Clara finalmente disse que amava Vitória. Vitória disse que também amava Clara. As d…”
- romance-02 #5: “coração partido em mil pedaços”

## Comparação com a avaliação humana

Pontuações humanas completas (os cinco critérios) de 1 avaliador(es).

| Medida | Valor |
|---|---|
| Casos comparados | 36 |
| Leitura − humano, média | -8,6 |
| Leitura − humano, mediana | -27,5 |
| Casos em que a faixa total da leitura difere | 4 de 36 |

| Caso | Avaliadores | Média humana | Mín–máx entre avaliadores | Faixa humana | Média da leitura | Faixa da leitura | Leitura − humano |
|---|---|---|---|---|---|---|---|
| acao-01 | 1 | 258 | 258–258 | Em esboço | 242 | Em esboço | -16 |
| acao-02 | 1 | 474 | 474–474 | Em esboço | 499 | Em esboço | +25 |
| acao-03 | 1 | 848 | 848–848 | Forte | 890 | Forte | +42 |
| acao-03-r1 | 1 | 930 | 930–930 | Forte | 903 | Forte | -27 |
| acao-04 | 1 | 903 | 903–903 | Forte | 878,4 | Forte | -24,6 |
| acao-05 | 1 | 943 | 943–943 | Forte | 907,4 | Forte | -35,6 |
| luta-01 | 1 | 159 | 159–159 | Ausente | 234 | Em esboço | +75 |
| luta-02 | 1 | 433 | 433–433 | Em esboço | 518 | Funciona | +85 |
| luta-03 | 1 | 919 | 919–919 | Forte | 869 | Forte | -50 |
| luta-03-r1 | 1 | 927 | 927–927 | Forte | 881 | Forte | -46 |
| luta-04 | 1 | 948 | 948–948 | Forte | 909 | Forte | -39 |
| luta-05 | 1 | 574 | 574–574 | Funciona | 785,6 | Funciona | +211,6 |
| romance-01 | 1 | 405 | 405–405 | Em esboço | 388 | Em esboço | -17 |
| romance-02 | 1 | 546 | 546–546 | Funciona | 503 | Funciona | -43 |
| romance-02-r1 | 1 | 938 | 938–938 | Forte | 886,4 | Forte | -51,6 |
| romance-03 | 1 | 923 | 923–923 | Forte | 899 | Forte | -24 |
| romance-04 | 1 | 577 | 577–577 | Funciona | 803 | Forte | +226 |
| romance-05 | 1 | 942 | 942–942 | Forte | 907 | Forte | -35 |
| dialogo-01 | 1 | 268 | 268–268 | Em esboço | 215 | Em esboço | -53 |
| dialogo-02 | 1 | 351 | 351–351 | Em esboço | 347 | Em esboço | -4 |
| dialogo-03 | 1 | 919 | 919–919 | Forte | 880,2 | Forte | -38,8 |
| dialogo-03-r1 | 1 | 921 | 921–921 | Forte | 894 | Forte | -27 |
| dialogo-04 | 1 | 950 | 950–950 | Forte | 896,6 | Forte | -53,4 |
| dialogo-05 | 1 | 924 | 924–924 | Forte | 917 | Forte | -7 |
| suspense-01 | 1 | 368 | 368–368 | Em esboço | 244 | Em esboço | -124 |
| suspense-02 | 1 | 527 | 527–527 | Funciona | 571 | Funciona | +44 |
| suspense-03 | 1 | 893 | 893–893 | Forte | 865 | Forte | -28 |
| suspense-03-r1 | 1 | 936 | 936–936 | Forte | 892 | Forte | -44 |
| suspense-04 | 1 | 962 | 962–962 | Forte | 907 | Forte | -55 |
| suspense-05 | 1 | 844 | 844–844 | Forte | 822 | Forte | -22 |
| virada-01 | 1 | 306 | 306–306 | Em esboço | 178 | Ausente | -128 |
| virada-02 | 1 | 547 | 547–547 | Funciona | 700 | Funciona | +153 |
| virada-03 | 1 | 915 | 915–915 | Forte | 883 | Forte | -32 |
| virada-04 | 1 | 943 | 943–943 | Forte | 850 | Forte | -93 |
| virada-04-r1 | 1 | 947 | 947–947 | Forte | 864 | Forte | -83 |
| virada-05 | 1 | 916 | 916–916 | Forte | 945 | Forte | +29 |

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
| Leitura − painel, média | +44,2 |
| Leitura − painel, mediana | +13,5 |
| Casos em que a faixa total da leitura difere | 9 de 36 |

| Caso | Avaliadores | Média do painel | Mín–máx entre avaliadores | Faixa do painel | Média da leitura | Faixa da leitura | Leitura − painel |
|---|---|---|---|---|---|---|---|
| acao-01 | 5 | 160 | 90–203 | Ausente | 242 | Em esboço | +82 |
| acao-02 | 5 | 406,4 | 250–492 | Em esboço | 499 | Em esboço | +92,6 |
| acao-03 | 5 | 817,2 | 725–870 | Forte | 890 | Forte | +72,8 |
| acao-03-r1 | 5 | 870,4 | 830–908 | Forte | 903 | Forte | +32,6 |
| acao-04 | 5 | 876,2 | 840–921 | Forte | 878,4 | Forte | +2,2 |
| acao-05 | 5 | 919,6 | 885–964 | Forte | 907,4 | Forte | -12,2 |
| luta-01 | 5 | 151 | 95–215 | Ausente | 234 | Em esboço | +83 |
| luta-02 | 5 | 358 | 235–413 | Em esboço | 518 | Funciona | +160 |
| luta-03 | 5 | 900 | 854–945 | Forte | 869 | Forte | -31 |
| luta-03-r1 | 5 | 900 | 854–945 | Forte | 881 | Forte | -19 |
| luta-04 | 5 | 930 | 905–948 | Forte | 909 | Forte | -21 |
| luta-05 | 5 | 553,2 | 370–675 | Funciona | 785,6 | Funciona | +232,4 |
| romance-01 | 5 | 292,6 | 170–395 | Em esboço | 388 | Em esboço | +95,4 |
| romance-02 | 5 | 433 | 265–565 | Em esboço | 503 | Funciona | +70 |
| romance-02-r1 | 5 | 910 | 875–953 | Forte | 886,4 | Forte | -23,6 |
| romance-03 | 5 | 909,4 | 886–934 | Forte | 899 | Forte | -10,4 |
| romance-04 | 5 | 631,8 | 530–740 | Funciona | 803 | Forte | +171,2 |
| romance-05 | 5 | 917 | 895–939 | Forte | 907 | Forte | -10 |
| dialogo-01 | 5 | 154,2 | 90–217 | Ausente | 215 | Em esboço | +60,8 |
| dialogo-02 | 5 | 256,2 | 195–327 | Em esboço | 347 | Em esboço | +90,8 |
| dialogo-03 | 5 | 888,2 | 875–904 | Forte | 880,2 | Forte | -8 |
| dialogo-03-r1 | 5 | 877,4 | 860–904 | Forte | 894 | Forte | +16,6 |
| dialogo-04 | 5 | 941 | 923–965 | Forte | 896,6 | Forte | -44,4 |
| dialogo-05 | 5 | 915,2 | 895–931 | Forte | 917 | Forte | +1,8 |
| suspense-01 | 5 | 219 | 135–290 | Em esboço | 244 | Em esboço | +25 |
| suspense-02 | 5 | 392,2 | 210–570 | Em esboço | 571 | Funciona | +178,8 |
| suspense-03 | 5 | 855,8 | 800–897 | Forte | 865 | Forte | +9,2 |
| suspense-03-r1 | 5 | 926,2 | 895–965 | Forte | 892 | Forte | -34,2 |
| suspense-04 | 5 | 914 | 860–949 | Forte | 907 | Forte | -7 |
| suspense-05 | 5 | 675,8 | 535–770 | Funciona | 822 | Forte | +146,2 |
| virada-01 | 5 | 167,6 | 115–228 | Ausente | 178 | Ausente | +10,4 |
| virada-02 | 5 | 461,4 | 290–595 | Em esboço | 700 | Funciona | +238,6 |
| virada-03 | 5 | 880,6 | 860–903 | Forte | 883 | Forte | +2,4 |
| virada-04 | 5 | 906,6 | 890–921 | Forte | 850 | Forte | -56,6 |
| virada-04-r1 | 5 | 906,6 | 890–921 | Forte | 864 | Forte | -42,6 |
| virada-05 | 5 | 908,2 | 885–961 | Forte | 945 | Forte | +36,8 |

## Consumo

| Medida por leitura concluída | Média | Mín–máx | Total |
|---|---|---|---|
| Tokens de entrada | 2.445 | 2.060–2.807 | 440.165 |
| Tokens de saída | 1.887 | 1.353–2.535 | 339.587 |
| Tokens de raciocínio (dentro da saída) | 957 | 576–1.536 | 172.288 |
| Duração (segundos) | 20 | 11–39 | 3.618 |

O custo em dinheiro fica para 1C-6, que registra o preço e o período usados.
