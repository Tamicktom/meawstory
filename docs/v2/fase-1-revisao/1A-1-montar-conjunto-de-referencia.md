# 1A-1 · Montar o conjunto de referência das leituras

**Fase 1 · Etapa A — Referência e linha de base** · Tipo: Pesquisa · [Card pai](../00-card-pai.md)

## Objetivo
Criar uma base humana para avaliar mudanças de modelo, prompt e formato antes de construir as telas novas.

## Escopo
- Começar com cerca de 30 cenas, aproximadamente 5 por gênero.
- Cobrir todos os gêneros e faixas da rubrica.
- Obter avaliação humana por critério e pontuação.
- Incluir cenas de referência e revisões com e sem mudança real.
- Definir o responsável inicial e convidar de 1 a 2 leitores experientes.

## Critérios de conclusão
- O conjunto versionado cobre os casos definidos e permite repetir a mesma avaliação em futuras mudanças.

## Resultado

**Situação em 2026-11-05: concluído.** O conjunto (versão 2) e as ferramentas estão prontos e versionados, e os 44 casos têm avaliação humana. A pessoa responsável aceitou a cobertura de faixas atual. A decisão está registrada no fim desta seção.

**Responsável pelo conjunto:** Tamicktom. Decide as mudanças de versão, as cenas que entram, quem avalia e quais avaliações valem.

### O que foi entregue

- **Conjunto versão 1**, em [`evaluation/reference`](../../../evaluation/reference/README.md): 30 cenas, 5 por gênero, usando os 12 temas do catálogo, e 6 revisões, uma por gênero. Três revisões têm mudança real (`acao-03-r1`, `romance-02-r1`, `suspense-03-r1`) e três só trocam palavras, norma culta e pontuação (`luta-03-r1`, `dialogo-03-r1`, `virada-04-r1`).
- **Cobertura das faixas:** cada gênero tem pelo menos uma cena escrita para cada faixa da nota total (Ausente, Em esboço, Funciona e Forte). Essa é a intenção de autoria, e não a avaliação humana. A cobertura real das faixas só será confirmada quando as notas humanas chegarem.
- **Sondas:** erros de grafia, finais sem vitória, tom cômico, prosa carregada, períodos longos, mistério explicado no fim e uma instrução ao corretor escondida na cena.
- **Versionamento:** `REFERENCE_SET_VERSION` e uma impressão digital dos casos e dos textos. `tests/unit/reference-set.test.ts` falha quando uma cena muda sem troca de versão, e também confere a cobertura por gênero, faixa e tema, o tamanho das cenas e as revisões.
- **Avaliação humana:** `bun run eval:forms` gera o material de leitura sem a intenção de autoria e uma planilha por caso e critério. As planilhas preenchidas ficam em `evaluation/reference/human/<avaliador>.csv`, e `bun run eval:report` passa a comparar a leitura da IA com elas. Planilhas de outra versão do conjunto são ignoradas.
- **Repetição:** `bun run eval:baseline` mede qualquer configuração no mesmo conjunto, e `bun run eval:report` recalcula o relatório sem chamar o modelo. A primeira medição está em [1A-2](1A-2-medir-consistencia-da-leitura-atual.md).

**Autoria das cenas:** as cenas da versão 1 foram escritas com IA (Claude) para que o conjunto existisse antes do teste com pessoas. Não vêm de pessoas usuárias e não contêm dados pessoais. Trocar cenas por textos escritos por gente, com autorização, é possível numa nova versão. Vale avaliar isso com quem for avaliar.

### Painel de modelos (provisório, não é avaliação humana)

Em 2026-11-05, cinco modelos de IA preencheram a planilha completa no lugar de pessoas: GPT-6.1 Sol, GPT-6.1 Terra, Claude Opus 5.5, Claude Haiku 5.5 e Kimi K3. Cada modelo leu só o material de `eval:forms`, sem acesso às leituras, à intenção de autoria ou ao relatório. As planilhas ficam em `evaluation/reference/model-panel/`, e o relatório as mostra numa seção própria. **Elas não fecham este card:** modelos tendem a compartilhar vieses entre si e com a leitura que se quer medir.

O que o painel sugere sobre o conjunto:

- **A cobertura de faixas é mais fraca do que a intenção de autoria indica.** Pela média do painel, só Luta tem cena nas quatro faixas. Ação, Diálogo e Virada não têm cena em Funciona: as cenas escritas para Funciona caíram em Forte. Romance e Suspense não têm cena em Ausente (`romance-01` ficou em 293, `suspense-01` em 219). Se a avaliação humana confirmar, a versão 2 precisa de cenas medianas de verdade nesses gêneros.
- **As revisões sem mudança real receberam do painel a mesma nota da original** em `luta-03-r1` e `virada-04-r1`, e 11 pontos a menos em `dialogo-03-r1`.
- **Os modelos divergem mais nas cenas fracas,** por exemplo `suspense-02`, de 210 a 570. A avaliação humana pode começar por elas.

### Primeira avaliação humana

Em 2026-11-05 chegou uma avaliação humana completa: `human/amanda.csv`, com os 36 casos e as 180 notas. Uma segunda planilha foi descartada antes do relatório porque mostrou indícios fortes de ter sido gerada com IA. As notas totais tinham correlação de 0,998 com as de um dos modelos do painel, 63 das 180 notas eram idênticas e as observações eram paráfrases linha a linha. A pessoa responsável pelo projeto decidiu manter só a planilha da Amanda.

**Cobertura das faixas pela avaliação humana:** só Luta tem cenas nas quatro faixas.

| Gênero | Faixas na avaliação humana | Falta |
|---|---|---|
| Ação | Em esboço, Forte | Ausente, Funciona |
| Luta | Ausente, Em esboço, Funciona, Forte | — |
| Romance | Em esboço, Funciona, Forte | Ausente |
| Diálogo | Em esboço, Forte | Ausente, Funciona |
| Suspense | Em esboço, Funciona, Forte | Ausente |
| Virada | Em esboço, Funciona, Forte | Ausente |

As cenas escritas para Ausente ficaram quase todas em Em esboço (de 258 a 405, exceto `luta-01`, com 159). As cenas escritas para Funciona sem defeito proposital ficaram em Forte. Isso confirma o que o painel de modelos sugeria: **a versão 1 não cobre todas as faixas em todos os gêneros.** Uma versão 2 precisa de cenas mais fracas em cinco gêneros e de cenas medianas em Ação e Diálogo.

### Versão 2

Em 2026-11-05 foram acrescentados 8 casos, com `textVersion: "2"`. Os 36 casos da versão 1 não mudaram, e as notas humanas dadas a eles continuam valendo.

- **Ausente:** `acao-06`, `romance-06`, `dialogo-06`, `suspense-06` e `virada-06`. Cada um foge do gênero e do tema, e não apenas resume o tema: um resumo que ainda toca o tema ficou em Em esboço na avaliação humana da versão 1.
- **Funciona:** `acao-07` e `dialogo-07` cumprem o tema, mas têm defeitos visíveis: geografia vaga, emoção rotulada, vozes parecidas e um narrador que explica o subtexto.
- **Controle:** `luta-06` é `luta-05` sem o parágrafo com a instrução ao corretor. A inflação causada pela instrução passa a ser medida dentro do conjunto.

O material para a avaliação humana só dos casos novos sai de `bun run eval:forms --since 2`: 8 casos, 40 notas.

**Avaliação humana da versão 2:** a Amanda avaliou os 8 casos novos na mesma planilha (`human/amanda.csv`). As notas da versão 1 continuam valendo porque os textos não mudaram.

- **Ausente:** 4 das 5 cenas novas ficaram em Ausente: `dialogo-06` 37, `romance-06` 74, `suspense-06` 92 e `acao-06` 96. `virada-06` ficou em 220, logo acima do limite de 200.
- **Funciona:** as 2 cenas escritas para Funciona ficaram em Forte, com `acao-07` em 935 e `dialogo-07` em 882. As cenas que a leitora põe em Funciona têm um defeito de ofício claro: tema explicado, prosa carregada, mistério resolvido no fim ou instrução embutida. Defeitos leves não bastam.
- **Controle:** `luta-05` e `luta-06` receberam a mesma nota da leitora (574). A instrução embutida não muda a avaliação humana.

| Gênero | Faixas na avaliação humana | Falta |
|---|---|---|
| Ação | Ausente, Em esboço, Forte | Funciona |
| Luta | Ausente, Em esboço, Funciona, Forte | — |
| Romance | Ausente, Em esboço, Funciona, Forte | — |
| Diálogo | Ausente, Em esboço, Forte | Funciona |
| Suspense | Ausente, Em esboço, Funciona, Forte | — |
| Virada | Em esboço, Funciona, Forte | Ausente |

No conjunto todo, as quatro faixas têm cenas, e todos os gêneros cobrem pelo menos três faixas.

### Decisão de fechamento

**2026-11-05, Tamicktom:** fechar o card com a cobertura da versão 2. As quatro faixas da rubrica aparecem no conjunto, e todos os gêneros cobrem pelo menos três faixas na avaliação humana. Luta, Romance e Suspense cobrem as quatro.

Lacunas aceitas, para uma versão futura do conjunto:

- **Ação e Diálogo** não têm cena em Funciona. Para cair nessa faixa na avaliação humana, a cena precisa de um defeito de ofício claro, como tema explicado, prosa carregada ou golpes em lista; defeitos leves deixam a cena em Forte.
- **Virada** não tem cena em Ausente: `virada-06` ficou em 220, logo acima do limite de 200.
- **Uma leitora só:** não há como medir a concordância entre pessoas. Uma segunda leitora continua opcional pelo escopo.

Comparações de faixa nessas combinações de gênero e faixa ficam sem referência humana até que uma nova versão as cubra.
