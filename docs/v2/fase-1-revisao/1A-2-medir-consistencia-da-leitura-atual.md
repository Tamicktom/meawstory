# 1A-2 · Medir a consistência da leitura atual

**Fase 1 · Etapa A — Referência e linha de base** · Tipo: Pesquisa · [Card pai](../00-card-pai.md)

## Objetivo
Criar uma linha de base antes de trocar o formato da leitura.

## Escopo
- Ler cada cena de referência várias vezes com a configuração atual.
- Medir variação de pontuação e faixa por critério quando disponível.
- Verificar se uma cena inalterada ganha pontos apenas por ser enviada como revisão.
- Registrar resultados sem definir tolerâncias antes da primeira medição.

## Critérios de conclusão
- Existe um relatório reproduzível com variação observada e falhas conhecidas da configuração atual.

## Dependências
- [1A-1 · Montar o conjunto de referência das leituras](1A-1-montar-conjunto-de-referencia.md)

## Resultado

**Primeira medição em 2026-11-05**, com a configuração em produção: `gpt-5-mini`, instruções e prompt atuais e `store: false`. O conjunto foi a versão 1 de [1A-1](1A-1-montar-conjunto-de-referencia.md): 36 casos, 5 leituras de cada, 180 leituras. O relatório completo e as leituras brutas estão em [`evaluation/reference/baselines/2026-11-05-atual`](../../../evaluation/reference/baselines/2026-11-05-atual/report.md). Para repetir a medição, siga os comandos no topo do relatório.

Conforme o escopo, nenhuma tolerância foi definida. Os números abaixo são observações, e as tolerâncias ficam para 1D-1.

**Dependência:** 1A-1 foi fechado com o conjunto na versão 2, que é a mesma usada na segunda medição. A linha de base de referência é a da versão 2, e não precisa ser refeita.

### Variação entre leituras da mesma cena

- **Nota total:** o desvio-padrão mediano foi de 18 pontos, e a amplitude mediana, de 42,5. Em 28 dos 36 casos (78%), as cinco leituras caíram na mesma faixa total.
- **As cenas fracas variam mais.** Nas cenas escritas para Ausente, o desvio-padrão ficou entre 18 e 62 (`dialogo-01`: 115 a 285). Nas escritas para Forte, ficou entre 7 e 19.
- **Por critério:** em 36 dos 180 pares caso × critério (20%), as leituras usaram mais de uma faixa. Só 1 par (1%) teve faixas a duas posições de distância. Os critérios subjetivos de aposta são os menos estáveis: "O que os corpos protegem" (luta) teve desvio mediano de 18,6 e mudou de faixa em 4 de 6 casos, e "Aposta humana" (suspense) mudou de faixa em 4 de 6.
- **O maior desvio** (`romance-02`, 110 a 630) vem de uma leitura truncada, descrita em Falhas. Sem ela, o desvio do caso é de cerca de 20.

### A leitura separa pouco as faixas de cima

A comparação abaixo usa a intenção de autoria, e não a avaliação humana. Ela precisa ser confirmada pelas notas humanas.

| Intenção | Média das médias | Faixa da média |
|---|---|---|
| Ausente | 250 | Em esboço |
| Em esboço | 561 | Funciona |
| Funciona | 874 | Forte |
| Forte | 899 | Forte |

- As 10 cenas escritas para Funciona receberam de 803 a 945, e as 7 escritas para Forte, de 850 a 917. Os intervalos se sobrepõem por inteiro. A nota mais alta do conjunto (945) foi de uma cena escrita para Funciona (`virada-05`).
- Há compressão no topo: quase toda cena razoável fica entre 850 e 920, então sobra pouco espaço para uma revisão mostrar avanço.
- Cenas escritas para Em esboço ficaram em média em Funciona. `virada-02`, em que a virada vem de um discurso que explica o tema, recebeu 700.

### Revisões

A configuração atual não informa ao modelo que a cena é uma revisão, então o contexto de revisão não tem como inflar a nota. O que se observou:

- **As três revisões sem mudança real ganharam pontos:** +12 (`luta-03-r1`), +13,8 (`dialogo-03-r1`) e +14 (`virada-04-r1`), com diferença sobre o erro-padrão de 0,95, 2,19 e 1,18. Nenhuma, sozinha, é conclusiva com 5 leituras, mas as três apontam na mesma direção. A hipótese é que polir a norma culta renda cerca de 13 pontos sem mudar a cena.
- **As revisões com mudança real:** `acao-03-r1` ganhou +13, o mesmo que as revisões cosméticas, porque a original já estava em 890. `suspense-03-r1` ganhou +27, e `romance-02-r1`, que reescreve uma cena fraca, ganhou +383.
- Hoje, uma melhora real numa cena que já está em Funciona não se distingue de um polimento de superfície.

### Falhas conhecidas da configuração atual

- **Leitura truncada aceita como concluída:** em 1 de 180 leituras (`romance-02` #4), o texto parou no meio de uma frase depois do primeiro critério, sem linha "Nota", e `score` veio como 110, a nota de um só critério. A saída passou pelo schema e, em produção, viraria uma leitura concluída com nota errada. A soma e a validação de 1C-1 e 1C-2 precisam rejeitar esse caso.
- **Instrução dentro da cena:** `luta-05` traz uma instrução para dar 1000. Nenhuma das 5 leituras deu 1000 nem mencionou a instrução, mas a cena recebeu 785,6, numa faixa estreita (775 a 790). Num controle exploratório, que não faz parte do conjunto, a mesma cena sem o parágrafo da instrução foi lida 5 vezes e ficou em 724 (665 a 760). É um indício de cerca de 60 pontos de inflação e entra em 1C-4.
- **Citações:** de 1.325 trechos citados com quatro ou mais palavras, 93 (7%) não aparecem nem na cena nem no enunciado, e outros 25 vêm do enunciado do tema e não da cena. Entre os 93 há paráfrases com reticências, mas também trechos inventados: `acao-05` "um passo. a porta rangeu. dois passos." e `luta-04` "o braço esquerdo latejava, como se uma corda puxasse o ombro para baixo". Isso entra em 1C-3.
- **Formato livre:** as notas por critério vieram em pelo menos quatro formatos (`145/150`, `— 140/150`, `(0-150): 25` e `(0-150) — 140`). O relatório recupera todas, exceto a da leitura truncada. Isso sustenta a decisão de 1C-1 de estruturar a saída por critério.
- **Sem falhas de chamada:** nenhuma das 180 chamadas falhou. Nas 179 leituras completas, a linha "Nota" coincidiu com `score`, a soma dos critérios também coincidiu, e nenhum critério passou do máximo.
- **Regras que a leitura respeitou:** erros de grafia (`acao-04`: 878), finais sem vitória (`acao-05`: 907, `luta-04`: 909), tom cômico (`dialogo-05`: 917) e períodos longos (`virada-05`: 945) não foram penalizados. O mistério explicado no fim custou pouco (`suspense-05`: 822, contra 865 de `suspense-03`).

### Comparação com a avaliação humana

Há uma leitora humana (ver [1A-1](1A-1-montar-conjunto-de-referencia.md)). Com uma pessoa só, estas são indicações, não medidas de concordância.

- **Na média, a leitura fica perto da leitora:** 8,6 pontos abaixo (mediana de -27,5). A faixa total diverge em 4 de 36 casos.
- **Nas cenas fortes, a leitura dá menos que a leitora:** de 25 a 93 pontos abaixo. Ela põe essas cenas entre 900 e 960; a leitura, entre 850 e 920.
- **Nas sondas de defeito, a leitura dá muito mais que a leitora.** As maiores diferenças são as mesmas que apareceram no painel:

  | Caso | Defeito | Leitura − humano |
  |---|---|---|
  | `romance-04` | prosa carregada | +226 |
  | `luta-05` | instrução dentro da cena | +212 |
  | `virada-02` | discurso que explica o tema | +153 |
  | `luta-02` | golpes em lista | +85 |
  | `luta-01` | troca a luta por discussão | +75 |

  Ou seja, a leitura não pune os defeitos que a rubrica descreve, mesmo quando a leitora e os 5 modelos punem.
- **Revisões:** nas três sem mudança real, a leitora deu +8, +2 e +4, e a leitura deu de +12 a +14. Nas três com mudança real, a leitora deu +82 (`acao-03-r1`), +392 (`romance-02-r1`) e +43 (`suspense-03-r1`), e a leitura deu +13, +383 e +27. A leitura premia o polimento um pouco mais que a leitora, e as melhoras reais nas cenas que já eram boas bem menos.
- **A generosidade com cenas fracas, vista no painel, não se confirma de forma geral.** A leitora foi mais generosa que a leitura em `suspense-01` (368 contra 244) e em `virada-01` (306 contra 178). O que se confirma é a falta de punição aos defeitos das sondas.

### Comparação com o painel de modelos

Cinco modelos de IA avaliaram o conjunto às cegas (ver [1A-1](1A-1-montar-conjunto-de-referencia.md)). Isso **não substitui a avaliação humana**, mas dá uma segunda referência enquanto ela não chega.

- **A leitura é mais generosa com cenas fracas.** Em média ela ficou 44 pontos acima do painel (mediana de +13,5), e a diferença se concentra embaixo. Todas as cenas que o painel pôs em Ausente ou Em esboço receberam mais da leitura, de +10 a +239. As maiores diferenças são justamente as sondas de defeito: `virada-02` (discurso que explica o tema) +239, `luta-05` (instrução embutida) +232, `suspense-02` +179, `romance-04` (prosa carregada) +171, `luta-02` +160 e `suspense-05` (mistério explicado) +146. Nas cenas que o painel pôs em Forte, a leitura fica perto do painel ou abaixo dele, de -57 a +73.
- **A falta de separação no topo vem em parte do conjunto.** O painel também põe em Forte quase todas as cenas escritas para Funciona. Então não há como saber se a leitura separa Funciona de Forte antes de existirem cenas medianas de verdade.
- **Na faixa total, a leitura diverge do painel em 9 de 36 casos.** Em todos esses casos, a leitura deu a faixa acima.
- **As revisões com mudança real ganharam menos na leitura do que no painel:** `acao-03-r1` +13 na leitura contra +53 no painel, e `suspense-03-r1` +27 contra +70. Já as revisões sem mudança real ganharam cerca de 13 pontos na leitura e nada no painel, com exceção de `dialogo-03-r1`, em que o painel deu 11 a menos.
- **Instrução dentro da cena:** o painel deu 553 a `luta-05`, contra 786 da leitura, e nenhum modelo do painel seguiu a instrução. Somado ao controle sem a instrução (724), isso sugere que a leitura é generosa com essa cena de qualquer jeito e que a instrução acrescenta cerca de 60 pontos.

Hipótese para 1C e 1D-1, apoiada pela leitora e pelo painel: a leitura atual não pune os defeitos de ofício que a rubrica descreve (prosa carregada, tema explicado, golpes sem consequência, instrução embutida), comprime as cenas boas abaixo de onde a leitora as põe e premia pouco a melhora real em cenas que já eram boas.

### Segunda medição, no conjunto versão 2

Na mesma data, a medição foi repetida no conjunto inteiro da versão 2: 44 casos, 220 tentativas, em [`baselines/2026-11-05-atual-v2`](../../../evaluation/reference/baselines/2026-11-05-atual-v2/report.md). Esta é a linha de base de referência daqui em diante. A primeira medição fica como registro da versão 1.

- **A medição se repete:** nos 36 casos medidos nas duas rodadas, a diferença entre as médias foi de +3,8 pontos em média, com diferença absoluta mediana de 9,4. O maior desvio, 82 pontos, é de `romance-02` e vem da leitura truncada da primeira rodada.
- **Variação:** desvio-padrão mediano de 17,5 e amplitude mediana de 40. Em 36 dos 44 casos (82%), as leituras caíram na mesma faixa total. Nenhum par caso × critério teve faixas a duas posições de distância.
- **Instrução dentro da cena, agora com controle:** `luta-05` ficou em 786 (de 760 a 805) e o controle `luta-06`, sem a instrução, em 736,2 (de 680 a 780). A diferença de +50 pontos equivale a cerca de 2,4 erros-padrão e confirma a medição exploratória (+62). Nenhuma leitura deu 1000 nem mencionou a instrução.
- **Cenas novas:**
  - 4 das 5 escritas para Ausente ficaram em Ausente: `dialogo-06` 48, `romance-06` 102, `suspense-06` 116 e `acao-06` 171. `virada-06` ficou em 320.
  - As 2 escritas para Funciona ficaram em Forte: `acao-07` 880 e `dialogo-07` 842. Falta a avaliação humana para saber se a leitura infla essas cenas ou se elas não são medianas.
- **Falhas novas:**
  - 3 tentativas falharam, todas recuperáveis no produto: 2 com "No object generated: could not parse the response" (`luta-02`, `virada-01`) e 1 que estourou o tempo limite depois de 334 segundos (`suspense-05`).
  - **Segunda leitura incompleta aceita:** `suspense-06` #1 tem só o parágrafo de abertura, de 291 caracteres, sem critérios nem linha "Nota", e foi aceita com nota 120. Somada à da primeira rodada, são 2 em 397 leituras concluídas.
  - **Erro de conta do modelo:** em `acao-02` #2, os critérios somam 520, mas a linha "Nota" e `score` dizem 530. Isso reforça 1C-2: a soma precisa ser calculada no servidor.
  - Citações: 112 de 1.604 (7%) não aparecem nem na cena nem no enunciado, a mesma proporção da primeira rodada.
- **Comparação com a leitora humana** (os 44 casos da versão 2): a leitura fica 3 pontos acima dela em média (mediana de -19), e a faixa total diverge em 3 de 44 casos. Os casos em que a leitura não pune os defeitos se repetem. Nas cenas novas para Ausente, a leitura dá de 11 a 100 pontos a mais que a leitora, mas fica na mesma faixa em todas.
- **A instrução embutida afeta só a IA:** a leitora deu 574 a `luta-05` e ao controle `luta-06`. A leitura deu 786 e 736. Mesmo sem a instrução, a leitura fica 162 pontos acima da leitora nessa cena.

### Consumo

Cada leitura usou em média 2.445 tokens de entrada e 1.887 de saída, dos quais 957 de raciocínio, e levou 20 segundos (de 11 a 39). O preço por leitura fica para 1C-6.
