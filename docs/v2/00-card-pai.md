# Card pai — Meawstory V2

Este é o único lugar onde o andamento é marcado. Os cards descrevem o trabalho e não guardam status.

## Como marcar

- Marque `[x]` somente quando todos os critérios de conclusão do card forem atendidos.
- Em um card parcial, deixe `[ ]` e acrescente uma nota curta ao fim da linha.
- Em um card cancelado por uma decisão, marque `[x]` e acrescente “não se aplica” e o motivo.
- Marque a fase na visão geral quando todos os cards dela estiverem marcados e a condição de saída for verdadeira.

## Recorte deste ciclo

Decisão de 2026-11-06. Não há tempo para o plano inteiro. Este ciclo entrega o essencial do MVP e a interface para usá-lo: escrever, receber a leitura, revisar, comparar versões, e navegar entre Início, Exercícios, Minhas cenas e Conta.

Ficam de fora, marcados como não se aplica:

- Pagamento, cota de plano gratuito e plano pago.
- Edição de dados, exportação, exclusão de conta e administração do catálogo.
- Sugestão por ponto fraco, tela de Progresso, aviso de leitura pronta por e-mail, teste de foco específico, expansão do catálogo e eventos do funil.

Os limites de abuso já definidos continuam valendo: de 100 a 2.000 palavras, 10 leituras em 24 horas e 3 envios em 10 minutos. Não existe cota de plano.

## Visão geral

- [x] **[Fase 0 — Corrigir a base](#fase-0--corrigir-a-base)** (25 cards)
- [ ] **[Fase 1 — Ciclo de revisão](#fase-1--ciclo-de-revisão)** (32 neste ciclo; 1 não se aplica)
- [ ] **[Fase 2 — Motivo para voltar](#fase-2--motivo-para-voltar)** (11 neste ciclo; 9 não se aplicam)
- [x] **[Fase 3 — Sustentar o negócio](#fase-3--sustentar-o-negócio)** — não se aplica (8 cards)

Total neste ciclo: 68 cards. Dezoito ficam fora e permanecem no plano só como registro.

## Fase 0 — Corrigir a base

**Objetivo:** Uma pessoa consegue entrar e usar o ciclo atual sem encontrar estados falsos ou caminhos quebrados.

**Condição de saída:** Uma pessoa real cria a conta, escreve, recebe a leitura e reencontra a cena, no computador e no celular, com termos e privacidade publicados.

**Ordem:** A vem primeiro, porque fecha decisões usadas pelas demais. B e C podem correr em paralelo. D vem depois de C, para localizar e adaptar as telas já corrigidas. E fecha a fase.

### A. Decisões

- [x] [0A-1](fase-0-base/0A-1-definir-limites-de-envio.md) — Definir os limites iniciais de envio
- [x] [0A-2](fase-0-base/0A-2-decidir-verificacao-de-email.md) — Decidir quando exigir verificação de e-mail
- [x] [0A-3](fase-0-base/0A-3-confirmar-uso-de-dados-pela-openai.md) — Confirmar retenção e uso de dados pela OpenAI
- [x] [0A-4](fase-0-base/0A-4-decidir-se-primeira-leitura-exige-conta.md) — Decidir se a primeira leitura exige conta

### B. Entrada e conta

- [x] [0B-1](fase-0-base/0B-1-criar-landing-do-produto.md) — Criar a landing do produto
- [x] [0B-2](fase-0-base/0B-2-redirecionar-acesso-e-retomar-destino.md) — Redirecionar acesso e retomar o destino
- [x] [0B-3](fase-0-base/0B-3-conectar-login-e-cadastro.md) — Conectar as telas de login e cadastro
- [x] [0B-4](fase-0-base/0B-4-configurar-envio-de-emails-com-resend.md) — Configurar o envio de e-mails com Resend
- [x] [0B-5](fase-0-base/0B-5-implementar-recuperacao-de-senha.md) — Implementar recuperação de senha por e-mail
- [x] [0B-6](fase-0-base/0B-6-implementar-verificacao-de-email.md) — Implementar a verificação de e-mail

### C. Ciclo atual confiável

- [x] [0C-1](fase-0-base/0C-1-transformar-lista-de-textos-em-minhas-cenas.md) — Transformar a lista de textos em Minhas cenas
- [x] [0C-2](fase-0-base/0C-2-exibir-estados-da-leitura.md) — Exibir cada estado da leitura
- [x] [0C-3](fase-0-base/0C-3-iniciar-editor-vazio-e-manter-paragrafos.md) — Iniciar o editor vazio e manter apenas parágrafos
- [x] [0C-4](fase-0-base/0C-4-validar-tamanho-da-cena.md) — Validar o tamanho da cena antes da leitura
- [x] [0C-5](fase-0-base/0C-5-limitar-envios-por-pessoa.md) — Limitar envios por pessoa
- [x] [0C-6](fase-0-base/0C-6-definir-tempo-limite-da-espera.md) — Definir tempo limite para a espera da leitura
- [x] [0C-7](fase-0-base/0C-7-tentar-leitura-novamente-sem-duplicar.md) — Tentar a leitura novamente sem duplicar a cena
- [x] [0C-8](fase-0-base/0C-8-destravar-cena-sem-leitura-iniciada.md) — Destravar cena salva sem leitura iniciada

**Validação da etapa C (2026-11-05):** 200 testes unitários, 15 testes de componentes e 13 testes E2E direcionados passaram, além de `bun run typecheck` e `bun run build`. PostgreSQL 18 isolado na porta 5434 e app de teste na 3002, pois as portas padrão estavam ocupadas. Sem mudança de tabelas ou migração nova. Espera: aviso após 2 minutos, falha recuperável após 10 minutos, reconciliada ao consultar ou iniciar leituras.

### D. Português, celular e páginas de sistema

- [x] [0D-1](fase-0-base/0D-1-localizar-interface-em-portugues.md) — Localizar toda a interface em português
- [x] [0D-2](fase-0-base/0D-2-limpar-pagina-atual-do-exercicio.md) — Limpar a página atual do exercício
- [x] [0D-3](fase-0-base/0D-3-adaptar-escrita-ao-celular.md) — Adaptar a escrita ao celular
- [x] [0D-4](fase-0-base/0D-4-adaptar-leitura-ao-celular.md) — Adaptar a leitura ao celular
- [x] [0D-5](fase-0-base/0D-5-criar-paginas-de-sistema.md) — Criar páginas de carregamento, erro e não encontrado

**Validação da etapa D (2026-11-05):** 212 testes unitários, 69 testes de componentes e 56 testes E2E passaram, além de `bun run typecheck`, `bun run build` e React Doctor (100/100). Ciclo completo de exercício, escrita, envio, leitura e histórico validado em 320, 390 e 1280 px; componentes móveis também cobrem rascunho, espera, falha e conteúdo longo sem rolagem horizontal. Páginas não encontradas verificadas em rotas públicas e autenticadas; carregamento e recuperação de erro cobertos nos testes de componentes. O build usou `RESEND_API_KEY` fictícia apenas para satisfazer a validação do ambiente de produção, sem envio de e-mail. Sem mudança de tabelas ou migrações.

### E. Preparação para pessoas reais

- [x] [0E-1](fase-0-base/0E-1-publicar-termos-privacidade-e-aviso-openai.md) — Publicar termos, privacidade e aviso sobre a OpenAI
- [x] [0E-2](fase-0-base/0E-2-atualizar-readme-do-produto.md) — Atualizar o README do produto

**Validação da etapa E (2026-11-05):** termos e privacidade disponíveis nas rotas públicas `/termos` e `/privacidade`, com links na landing, no cadastro, no editor e nas ações de iniciar ou repetir a leitura. No cadastro e na escrita, abrir os documentos em outra aba preserva os dados preenchidos e o destino de retorno. O compartilhamento de entradas e saídas para melhoria dos modelos foi confirmado como desativado pela pessoa responsável pelo projeto e registrado em 0A-3. O README descreve o produto atual, instalação, ambiente, banco, e-mails, testes e referências de negócio. Passaram 222 testes unitários, 42 testes dos componentes afetados e 21 testes E2E direcionados, além de `bun run typecheck`, `bun run build` e React Doctor nas alterações (100/100). A varredura completa incluiu os arquivos novos e apontou somente um aviso no handler gerado pelo Workflow em `app/.well-known/workflow/v1/webhook/[token]/route.js`, ignorado pelo Git e fora das alterações desta etapa (65/100 na varredura completa). As jornadas cobrem 320, 390 e 1280 px. O build usou uma chave Resend fictícia apenas para validação do ambiente, sem envio de e-mail. Sem mudança de tabelas ou migrações.

**Operação do teste por convite:** público de 18 anos ou mais, com declaração no cadastro; pedidos sobre dados e avisos de mudanças usam o canal do convite, sem prometer uma caixa de e-mail que ainda não existe. A política explicita a ausência de prazo confirmado para retenção do Workflow em produção e não promete exclusão imediata. Confirmar esse prazo e revisar juridicamente os documentos antes do teste com pessoas reais, conforme 0A-3. A fase 0 permanece sem marcação na visão geral até a condição de saída ser validada com uma pessoa real; os testes automatizados acima não substituem essa validação.

## Fase 1 — Ciclo de revisão

**Objetivo:** A pessoa escreve, lê, revisa e vê a diferença. É a fase que define o produto.

**Condição de saída:** Uma revisão pode ser enviada e comparada com a versão anterior, sem inflar a pontuação. Erros e custo já são medidos.

**Ordem:** A → B → C → D. **D é o portão da fase:** F, G e H só começam depois dele. E pode começar assim que B terminar. Em I, a exclusão pode entrar a qualquer momento. A instrumentação do funil não se aplica neste ciclo.

### A. Referência e linha de base

- [x] [1A-1](fase-1-revisao/1A-1-montar-conjunto-de-referencia.md) — Montar o conjunto de referência das leituras
- [x] [1A-2](fase-1-revisao/1A-2-medir-consistencia-da-leitura-atual.md) — Medir a consistência da leitura atual

**Validação da etapa A (2026-11-05):** o conjunto v2 tem 37 cenas, 6 revisões e 1 controle. A linha de base foi medida duas vezes com a configuração em produção: 180 tentativas na v1 e 220 na v2, com 3 falhas recuperáveis. A diferença absoluta mediana entre as duas rodadas foi de 9,4 pontos. Os achados que alimentam as etapas B e C: 2 leituras incompletas aceitas com nota errada e 1 erro de soma do modelo (1C-1, 1C-2); +50 pontos causados pela instrução dentro da cena, medidos contra o controle (1C-4); 7% das citações fora da cena e do enunciado (1C-3); revisões só cosméticas ganhando cerca de 13 pontos. Nas 6 cenas que a leitora pôs em Funciona, a leitura deu de 30 a 218 pontos a mais. Uma leitora humana e um painel de 5 modelos de IA concordam que a leitura não pune os defeitos das sondas: ela fica até 218 pontos acima da leitora nesses casos, na medição da v2. Com a v2, a avaliação humana cobre as quatro faixas no conjunto e pelo menos três em cada gênero. Tamicktom, responsável pelo conjunto, fechou a etapa com três lacunas registradas em 1A-1: Funciona em Ação e em Diálogo, e Ausente em Virada. Passaram 255 testes unitários, `bun run typecheck` e o Fallow nas alterações. Não houve mudança de tabelas nem migração.

### B. Dados da leitura e do exercício

- [x] [1B-1](fase-1-revisao/1B-1-estruturar-rubrica-e-versao-publica.md) — Estruturar a rubrica e criar sua versão pública
- [x] [1B-2](fase-1-revisao/1B-2-estruturar-metadados-do-exercicio.md) — Estruturar gênero, objetivo e extensão do exercício
- [x] [1B-3](fase-1-revisao/1B-3-estruturar-briefing-do-exercicio.md) — Estruturar o briefing do exercício
- [x] [1B-4](fase-1-revisao/1B-4-congelar-criterios-em-cada-leitura.md) — Congelar critérios e pontuações em cada leitura
- [x] [1B-5](fase-1-revisao/1B-5-registrar-modelo-e-versao-do-prompt.md) — Registrar modelo e versão do prompt em cada leitura

**Validação da etapa B (2026-11-05):** rubricas passam a guardar os cinco critérios, máximos, faixas e frases públicas; os 12 exercícios têm gênero, objetivo, extensão e briefing estruturados, preenchidos pela migração `20261106015708_reading_data` e mantidos pelo seed. O briefing público usa esses dados, sem instruções internas; o contador recebe a extensão sugerida, mantendo os limites operacionais de 100–2.000 palavras. Cada nova tentativa congela critérios, fontes e configuração completa do modelo/prompt, inclusive em falhas. O banco protege os snapshots e resultados terminais; o contrato versionado guarda pontuações, faixas, citações, leitura geral, ponto forte e foco, sem recalcular resultados antigos. A geração desse resultado estruturado continua na etapa C: o motor atual ainda produz markdown, preservado sem inventar critérios para leituras antigas. Os relatórios de avaliação registram a versão do prompt; medições antigas continuam legíveis. Passaram 270 testes unitários, 13 testes de componentes, 3 jornadas E2E em 320, 390 e 1280 px, `bun run typecheck` e `bun run build`; React Doctor nas alterações: 96/100, sem diagnósticos. Migração testada em PostgreSQL 18 isolado na porta 5434, tanto em banco vazio quanto sobre o esquema anterior com catálogo e leitura concluída; o conteúdo legado foi preservado. A migração também foi aplicada ao banco local da porta 5432, com os 12 exercícios preenchidos. Modelo, instruções, rubricas renderizadas e prompt atuais permaneceram iguais; nenhuma chamada à OpenAI ou nova linha de base. O build usou uma chave Resend fictícia apenas para validação do ambiente, sem enviar e-mails.

### C. Motor e operação da leitura

- [x] [1C-1](fase-1-revisao/1C-1-gerar-leitura-estruturada.md) — Gerar a leitura estruturada por critério
- [x] [1C-2](fase-1-revisao/1C-2-calcular-pontuacao-e-faixas-no-servidor.md) — Calcular pontuação e faixas no servidor
- [x] [1C-3](fase-1-revisao/1C-3-validar-trechos-citados.md) — Validar os trechos citados pela leitura
- [x] [1C-4](fase-1-revisao/1C-4-proteger-leitura-contra-instrucoes-da-cena.md) — Proteger a leitura contra instruções dentro da cena
- [x] [1C-5](fase-1-revisao/1C-5-monitorar-erros-e-operacao-da-leitura.md) — Monitorar erros e operação da leitura
- [x] [1C-6](fase-1-revisao/1C-6-medir-custo-por-leitura.md) — Medir o custo por leitura

**Validação da etapa C (2026-11-05):** a leitura passa a ser estruturada. O modelo devolve, para cada critério, pontuação, o que funciona, o que falta e citações; depois, ponto forte, leitura geral e foco. O servidor confere a cobertura dos cinco critérios congelados e os máximos, calcula faixas e total, e descarta as citações que não estão literalmente na cena. Quando o ponto forte ou algum critério fica sem citação, ou a resposta é rejeitada por outro motivo, a leitura é pedida de novo uma vez, com o motivo. A segunda rejeição vira falha recuperável. Por decisão de Tamicktom, registrada em 1C-3 e 1C-5, a regra das citações é "descartar e refazer se faltar", e o monitoramento é próprio, no banco, sem fornecedor novo. A migração `20261106024107_reading_engine` cria `reading_call` (custo por chamada) e `operation_alert`, acrescenta etapa, tempos e motivo da falha a `correction`, congela esses campos no resultado terminal e faz o banco recusar citação fora da cena ou critério sem citação. Logs estruturados cobrem workflow, API, servidor e páginas de erro. `bun run ops:report` mostra tempo até a leitura, taxa de falha por etapa e custo por leitura concluída, com as tentativas descartadas. Os alertas saem por e-mail e no log; um cron diário da Vercel reconcilia os tempos esgotados. O preço registrado do `gpt-5-mini` é US$ 0,25, 0,025 e 2,00 por milhão de tokens (entrada, cache e saída), conferido em 2026-11-05. O conjunto de referência foi para a versão 3, com três sondas de instrução. A medição de 1C-4 (40 leituras, US$ 0,22) não teve nenhuma nota 1000, nenhum foco ditado pela cena e nenhuma instrução citada; a inflação de `luta-05` caiu de +50 para +15 pontos, dentro do ruído. As quatro diferenças ainda apontam para cima, e 1D-1 deve medi-las com mais leituras. Uma leitura custou em média US$ 0,0054, com 2,8 mil tokens de entrada e 2,6 mil de saída, em 28 s. Passaram 310 testes unitários, 62 testes E2E e 69 testes de componentes, além de `bun run typecheck`, `bun run build`, a auditoria Fallow 3.34.1 nos arquivos alterados (sem achados) e o React Doctor nas alterações (97/100, sem diagnósticos). Migração aplicada do zero no PostgreSQL local da porta 5432, seguida de seed. A tela estruturada (1F-1) e a avaliação completa no conjunto (1D-1) ficam para as próximas etapas. A interface atual mostra um markdown gerado a partir da estrutura. **Para produção:** aplicar a migração e configurar `OPS_ALERT_EMAIL` e `CRON_SECRET` na Vercel. O build usou uma chave Resend fictícia apenas para validação do ambiente, sem envio de e-mail.

### D. Portão de validação

- [x] [1D-1](fase-1-revisao/1D-1-avaliar-leitura-estruturada-no-conjunto.md) — Avaliar a leitura estruturada no conjunto de referência — medição concluída, com falhas bloqueantes explicitadas
- [ ] [1D-2](fase-1-revisao/1D-2-testar-prototipo-de-leitura-e-revisao.md) — Testar o protótipo de leitura e revisão com escritores — protótipo, roteiro e ficha preparados; aguardando resolução dos bloqueios e 5 a 10 sessões reais

**Validação da etapa D (2026-11-06):** [resultado e decisão](validacao-1d/resultado.md). Foram 235 tentativas no conjunto v3, com 233 leituras concluídas e dois timeouts; gasto conhecido de US$ 1,45307, com o consumo dos timeouts desconhecido. As leituras aceitas cobrem os cinco critérios, somam corretamente, têm foco preenchido e guardam 2.507 citações literais. Nos 44 casos comuns à linha de base, o DP mediano aumentou de 17,52 para 20,18; 34/44 mantêm faixa total estável, contra 36/44 antes, e o erro absoluto médio frente à leitora passou de 55,51 para 65,16. As revisões cosméticas ficaram dentro do ruído definido, mas a revisão real de Ação não se separou. A sonda de Virada ganhou 109 pontos frente ao controle, acima da tolerância de 61,34, e `romance-07 #5` citou a falsa instrução como evidência. A inspeção qualitativa encontrou dois comentários cortados numa resposta aceita, interpretação sem apoio, falas prontas para copiar e focos com várias tarefas. **O portão não está liberado; F, G e H continuam aguardando.** 1D-1 fecha como avaliação com falhas explícitas, não como aprovação da configuração. Tamicktom informou que ainda não tem participantes e pediu preparar o teste: o HTML descartável, o roteiro e a ficha estão prontos, sem respostas humanas inventadas. Passaram 318 testes unitários, `bun run typecheck` e a conferência do protótipo em 320, 390 e 1280 px. Sem alteração de modelo, prompt, rubricas, cenas de referência, tabelas ou comportamento de produção.

### E. Escrita

- [ ] [1E-1](fase-1-revisao/1E-1-apresentar-briefing-completo.md) — Apresentar o briefing completo do exercício
- [ ] [1E-2](fase-1-revisao/1E-2-tornar-o-titulo-da-cena-opcional.md) — Tornar o título da cena opcional
- [ ] [1E-3](fase-1-revisao/1E-3-salvar-rascunho-no-servidor.md) — Salvar rascunho automaticamente no servidor
- [ ] [1E-4](fase-1-revisao/1E-4-impedir-alteracao-durante-a-leitura.md) — Impedir alteração do texto durante a leitura
- [ ] [1E-5](fase-1-revisao/1E-5-exibir-contador-e-checklist-da-cena.md) — Exibir contador de palavras e checklist da cena
- [ ] [1E-6](fase-1-revisao/1E-6-adicionar-painel-recolhivel-e-modo-foco.md) — Adicionar painel recolhível e modo foco
- [ ] [1E-7](fase-1-revisao/1E-7-criar-etapa-de-conferencia-antes-do-envio.md) — Criar a etapa de conferência antes do envio

### F. Tela da leitura

- [ ] [1F-1](fase-1-revisao/1F-1-criar-tela-da-leitura-estruturada.md) — Criar a tela da leitura estruturada
- [ ] [1F-2](fase-1-revisao/1F-2-manter-leituras-antigas-no-formato-original.md) — Manter leituras antigas no formato original
- [ ] [1F-3](fase-1-revisao/1F-3-marcar-trechos-citados-na-cena.md) — Marcar os trechos citados na cena
- [ ] [1F-4](fase-1-revisao/1F-4-coletar-utilidade-da-leitura.md) — Coletar se a leitura ajudou
- [ ] [1F-5](fase-1-revisao/1F-5-registrar-discordancia-de-criterio.md) — Registrar discordância de um critério

### G. Revisão e versões

- [ ] [1G-1](fase-1-revisao/1G-1-criar-revisao-e-guardar-versoes.md) — Criar uma revisão e guardar as versões
- [ ] [1G-2](fase-1-revisao/1G-2-registrar-intencao-da-revisao.md) — Registrar a intenção da revisão

### H. Comparação

- [ ] [1H-1](fase-1-revisao/1H-1-comparar-versoes-em-etapa-separada.md) — Comparar versões em uma etapa separada da avaliação
- [ ] [1H-2](fase-1-revisao/1H-2-exibir-comparacao-entre-versoes.md) — Exibir a comparação entre versões

### I. Controle e medição

- [ ] [1I-1](fase-1-revisao/1I-1-excluir-cena-com-opcao-de-desfazer.md) — Excluir uma cena com opção de desfazer
- [x] [1I-2](fase-1-revisao/1I-2-instrumentar-eventos-do-funil.md) — Instrumentar os eventos do funil — não se aplica; a medição do funil fica fora deste ciclo, e erros e custo já são medidos

## Fase 2 — Motivo para voltar

**Objetivo:** A pessoa volta e encontra a próxima ação, o histórico e o exercício.

**Condição de saída:** Ao voltar, a pessoa vê uma próxima ação, abre o histórico e escolhe um exercício no catálogo, no computador e no celular.

**Ordem:** A → B → C → E. A navegação usa a Conta. Minhas cenas e o catálogo usam o encerramento. O Início usa o histórico. 2G-1 espera o rascunho salvo e os trechos citados, e pode correr em paralelo com E. Sugestões, Progresso, e-mail de leitura pronta e expansão do catálogo não se aplicam neste ciclo.

### A. Conta e navegação

- [ ] [2A-1](fase-2-retorno/2A-1-criar-area-conta.md) — Criar a área Conta
- [ ] [2A-2](fase-2-retorno/2A-2-organizar-navegacao-principal.md) — Organizar a navegação principal

### B. Histórico e encerramento

- [ ] [2B-1](fase-2-retorno/2B-1-encerrar-e-reabrir-uma-cena.md) — Encerrar e reabrir uma cena
- [ ] [2B-2](fase-2-retorno/2B-2-registrar-quando-a-leitura-foi-aberta.md) — Registrar quando a leitura foi aberta
- [ ] [2B-3](fase-2-retorno/2B-3-evoluir-tela-minhas-cenas.md) — Evoluir a tela Minhas cenas

### C. Catálogo e sugestões

- [ ] [2C-1](fase-2-retorno/2C-1-enriquecer-cards-do-catalogo.md) — Enriquecer os cards do catálogo de exercícios
- [ ] [2C-2](fase-2-retorno/2C-2-filtrar-exercicios-por-genero-e-situacao.md) — Filtrar exercícios por gênero e situação
- [x] [2C-3](fase-2-retorno/2C-3-sugerir-exercicio-por-ponto-fraco.md) — Sugerir exercício a partir de pontos fracos — não se aplica; a sugestão por diagnóstico fica fora deste ciclo
- [x] [2C-4](fase-2-retorno/2C-4-resumir-encerramento-e-sugerir-proximo-exercicio.md) — Resumir o encerramento e sugerir o próximo exercício — não se aplica; o encerramento fica em 2B-1, sem sugestão de próximo exercício

### D. Progresso

- [x] [2D-1](fase-2-retorno/2D-1-exibir-resumo-de-progresso.md) — Exibir o resumo de progresso — não se aplica; a tela de Progresso fica fora deste ciclo
- [x] [2D-2](fase-2-retorno/2D-2-exibir-evolucao-por-criterio-e-genero.md) — Exibir evolução por critério dentro de cada gênero — não se aplica; a tela de Progresso fica fora deste ciclo
- [x] [2D-3](fase-2-retorno/2D-3-identificar-padroes-e-indicar-treino.md) — Identificar padrões recorrentes e indicar um treino — não se aplica; padrões e treino indicado ficam fora deste ciclo

### E. Início e primeira entrada

- [ ] [2E-1](fase-2-retorno/2E-1-orientar-inicio-pela-proxima-acao.md) — Orientar o Início pela próxima ação
- [ ] [2E-2](fase-2-retorno/2E-2-exibir-cenas-recentes-e-resumo-no-inicio.md) — Exibir cenas recentes no Início
- [ ] [2E-3](fase-2-retorno/2E-3-perguntar-objetivo-na-primeira-entrada.md) — Perguntar o objetivo na primeira entrada

### F. Notificações

- [x] [2F-1](fase-2-retorno/2F-1-notificar-leitura-pronta-por-email.md) — Notificar leitura pronta por e-mail — não se aplica; a leitura pronta aparece no produto, sem e-mail neste ciclo
- [x] [2F-2](fase-2-retorno/2F-2-permitir-desativar-notificacao-de-leitura.md) — Permitir desativar a notificação de leitura pronta — não se aplica; não há e-mail de leitura pronta neste ciclo

### G. Testes e expansão

- [ ] [2G-1](fase-2-retorno/2G-1-manter-italico-no-editor-e-no-envio.md) — Manter itálico no editor e no envio
- [x] [2G-2](fase-2-retorno/2G-2-testar-pedido-de-foco-especifico.md) — Testar pedido de foco específico para a leitura — não se aplica; o experimento fica fora deste ciclo
- [x] [2G-3](fase-2-retorno/2G-3-expandir-catalogo-por-generos-mais-usados.md) — Expandir o catálogo pelos gêneros mais usados — não se aplica; seguem os exercícios atuais

## Fase 3 — Sustentar o negócio

**Não se aplica neste ciclo (2026-11-06).** Pagamento, cota de plano gratuito e plano pago ficam de fora. Junto com eles saem a gestão avançada da conta e a administração do catálogo, porque este ciclo fica no MVP e na interface da prática.

**Objetivo original:** Operar com custo controlado, confiança e dados.

**Condição de saída original:** A cota é aplicada, o plano pago pode ser contratado e cancelado, a pessoa controla os próprios dados e o catálogo muda sem seed. Essa condição não será perseguida agora.

### A. Oferta e cota

- [x] [3A-1](fase-3-negocio/3A-1-definir-cota-e-versoes-do-plano-gratuito.md) — Definir cota e versões do plano gratuito — não se aplica; não há cota nem plano neste ciclo
- [x] [3A-2](fase-3-negocio/3A-2-controlar-cota-de-leituras.md) — Controlar a cota de leituras — não se aplica; os limites de abuso da Fase 0 continuam valendo
- [x] [3A-3](fase-3-negocio/3A-3-criar-plano-pago.md) — Criar o plano pago — não se aplica; pagamento fica fora deste ciclo

### B. Conta e dados

- [x] [3B-1](fase-3-negocio/3B-1-editar-dados-da-conta.md) — Editar os dados da conta — não se aplica; a Conta deste ciclo mostra nome, e-mail e sair
- [x] [3B-2](fase-3-negocio/3B-2-exportar-cenas-e-leituras.md) — Exportar cenas e leituras — não se aplica; exportação fica fora deste ciclo
- [x] [3B-3](fase-3-negocio/3B-3-excluir-conta-e-dados.md) — Excluir a conta e os dados — não se aplica; pedidos sobre dados seguem o canal já descrito na Fase 0

### C. Administração do catálogo

- [x] [3C-1](fase-3-negocio/3C-1-administrar-catalogo-e-rubricas.md) — Administrar o catálogo e as rubricas — não se aplica; o catálogo continua no seed
- [x] [3C-2](fase-3-negocio/3C-2-retirar-exercicio-sem-apagar-historico.md) — Retirar um exercício sem apagar o histórico — não se aplica; não há administração do catálogo neste ciclo
