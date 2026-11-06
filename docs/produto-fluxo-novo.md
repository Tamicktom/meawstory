# Meawstory: proposta de produto e novo fluxo

**Status:** proposta de produto. A execução deste ciclo está nos cards de `docs/v2/`.
**Data:** 2026-11-03. Recorte do ciclo em 2026-11-06.
**Público:** escritores de ficção praticando.

**Recorte de 2026-11-06.** Este ciclo entrega escrever, receber a leitura, revisar, comparar versões, e a interface para voltar: Início, Exercícios, Minhas cenas e Conta. Ficam fora pagamento, cota de plano, plano pago, edição e exportação da conta, exclusão de conta, administração do catálogo, sugestão por ponto fraco, tela de Progresso, aviso de leitura pronta por e-mail, teste de foco específico, expansão do catálogo e eventos do funil. Os limites de abuso já definidos continuam valendo.

## 1. A ideia em uma frase

> **Meawstory é um lugar para treinar cenas: você escreve, recebe uma leitura crítica apoiada no seu próprio texto, reescreve e vê o que melhorou.**

Hoje o produto termina na nota. No produto novo, a primeira leitura é o começo do trabalho, porque ficção melhora na reescrita.

### Para quem é

Pessoas que já escrevem ou querem escrever ficção e têm um destes problemas:

- Não sabem o que treinar nem por onde começar.
- Não têm um leitor disponível e honesto para cada exercício.
- Recebem comentários vagos, como "gostei" ou "falta alguma coisa".
- Revisam sem saber se a nova versão ficou melhor.

### Para quem não é, por enquanto

- Quem quer que a IA escreva por ele.
- Quem quer revisar um romance ou manuscrito inteiro.
- Quem está se preparando para redação escolar ou vestibular.

### Princípios

1. **A revisão é o produto.** Cada tela depois da leitura leva para a próxima versão ou para a próxima cena.
2. **A cena é de quem escreve.** A IA aponta e pergunta, mas nunca reescreve. A rubrica atual já exige isso, e passa a ser também uma promessa pública.
3. **Toda crítica tem evidência.** Um comentário sem trecho do texto não entra na leitura.
4. **Um foco por vez.** Cada leitura termina com uma única revisão, a que mais pode mudar a cena.
5. **Avaliar a cena, não a pessoa.** Não há ranking entre escritores nem mensagem de culpa por dias sem escrever.
6. **Nada se perde.** Rascunho salvo, falha sem perda de texto e todas as versões guardadas.

## 2. O que muda

| Hoje | No produto novo |
|---|---|
| A home é um template, sem caminho para entrar | Landing com a promessa, um exemplo de leitura e um botão para começar |
| Sem sessão aparece "Unauthorized" | A pessoa vai para o login e volta para onde estava |
| O dashboard tem só dois botões | O Início mostra a próxima ação certa |
| Temas sem gênero ou filtro | Exercícios por gênero, com o que cada um treina e a situação da pessoa |
| Os critérios ficam escondidos | "O que será observado" aparece antes de escrever |
| O editor abre com "Hello World!" e não salva rascunho | Editor limpo, com contador por tema e salvamento automático |
| A nota é um número, com o detalhe preso em um texto corrido | A leitura é dividida por critério, com trechos marcados na cena |
| O texto em correção aparece como "Nota 0 de 1000" | Cada estado tem sua própria tela |
| A correção sugere revisar, mas não há como | "Revisar com esse foco" abre a versão seguinte |
| Não há comparação entre versões | Comparação entre versões |

## 3. Linguagem do produto

A interface passa a ser toda em português e usa o vocabulário de quem escreve. O código e o banco podem manter os nomes atuais.

| Termo interno | Na interface | Motivo |
|---|---|---|
| `theme` | **Exercício** | É uma proposta para praticar |
| `text` | **Cena** | É a unidade de trabalho |
| `correction` | **Leitura** | "Correção" soa como prova |
| `rubric` | **O que será observado** | "Rubrica" é termo de avaliador |
| `score` | **Pontuação** | Fica em segundo plano |
| Faixas da rubrica | **Ausente, Em esboço, Funciona, Forte** | Dizem mais que um número |

A navegação principal deste ciclo fica assim: **Início, Exercícios, Minhas cenas e Conta**.

## 4. O novo fluxo

```mermaid
flowchart TD
    A[Landing] --> B[Criar conta ou entrar]
    B --> C[O que você quer treinar?]
    C --> D[Início]
    D --> E[Exercícios]
    D -->|continuar rascunho| G
    D -->|leitura pronta| K
    E --> F[Briefing do exercício]
    F --> G[Escrita com salvamento automático]
    G --> H[Conferir e enviar]
    H --> I[Leitura em andamento]
    I -->|falhou| J[Tentar de novo, com o texto salvo]
    J --> I
    I -->|pronta| K[Leitura da cena]
    K -->|revisar com o foco| L[Nova versão]
    L --> H
    K -->|segunda versão em diante| M[Comparação entre versões]
    M --> L
    M --> N[Dar a cena por encerrada]
    K --> N
    N --> O[Próximo exercício sugerido]
    O --> F
```

### 4.1 Landing

- **Mensagem:** "Escreva uma cena. Receba uma leitura honesta. Reescreva melhor."
- **Prova:** um trecho curto de cena com uma leitura real, e não uma lista de funcionalidades.
- **Como funciona:** três passos, sendo escrever, ler e revisar.
- **Promessa:** "A IA não escreve por você. Seu texto continua seu."
- **Ações:** "Escrever minha primeira cena" e "Já tenho conta".

### 4.2 Cadastro e primeira entrada

- As telas de cadastro e login têm link uma para a outra, e quem já tem sessão vai direto para o Início.
- Quem tentou abrir uma página interna volta para ela depois de entrar.
- A entrada tem uma única pergunta, que pode ser pulada: **"O que você quer treinar agora?"**. As opções são ação, luta, romance, diálogo, suspense e virada.
- A resposta leva a um exercício sugerido, sem tour e sem formulário longo.

### 4.3 Início

O Início mostra uma ação principal, escolhida nesta ordem:

| Situação da pessoa | Ação principal |
|---|---|
| Tem uma leitura pronta e ainda não aberta | **Ler a leitura de "A cozinha estreita"** |
| Tem uma leitura com falha | **Tentar a leitura de novo** |
| Tem uma leitura em andamento | **Sua cena está sendo lida** |
| Tem um rascunho salvo | **Continuar escrevendo**, com o número de palavras e a data |
| Leu, mas não revisou | **Revisar com o foco:** "...", com o foco já visível |
| Nenhuma das anteriores | **Escolher um exercício** |

Abaixo da ação ficam as cenas recentes. Quem está começando responde o que quer treinar, ou abre os exercícios.

### 4.4 Exercícios

- **Cada card mostra:** gênero, título, o que treina, extensão pedida e situação da pessoa nele.
- **Situações possíveis:** não escrito, rascunho, em revisão e encerrado.
- **Filtros:** gênero e situação.

### 4.5 Briefing do exercício

Esta tela substitui a página atual, que ainda mostra "Theme Page" e o ID interno. Ela reúne:

- Situação, o que já é verdade, o que a cena precisa conter, o que você decide e a extensão.
- **O que será observado:** os cinco critérios, com pontuação máxima e uma frase simples sobre cada um.
- **O que não será penalizado:** por exemplo ortografia, final triste ou estilo seco, quando serve à cena. Esse trecho reduz o medo de errar e vale deixar visível.
- Ação: **Começar a escrever**, ou **Continuar rascunho** se já houver um.

### 4.6 Escrita

- **Editor vazio,** com o convite "Comece no meio da cena." no lugar do "Hello World!".
- **Briefing em painel lateral recolhível,** que fica empilhado no celular.
- **Checklist do que a cena precisa conter,** marcado pela própria pessoa. Serve só de lembrete e não vai para a IA.
- **Contador de palavras** com a faixa do exercício, como "412 de 400 a 900". Os exercícios atuais variam entre 400-800, 400-900 e 500-1000.
- **Salvamento automático** no servidor, com o aviso "Salvo há instantes".
- **Foco:** um modo que esconde a navegação e o painel.
- **Formatação:** só o que realmente é mantido. Hoje o negrito aparece no editor, mas se perde no envio.

### 4.7 Conferir e enviar

Antes de usar uma leitura, uma etapa curta mostra:

- Contagem de palavras e os itens do checklist ainda não marcados.
- Aviso sem bloqueio quando a cena estiver fora da faixa: "Sua cena tem 310 palavras e o exercício pede de 400 a 900. Quer enviar mesmo assim?"
- Bloqueio apenas abaixo de um mínimo e acima de um máximo definidos, para evitar leituras sem valor e abuso de custo. Os tetos são os limites de abuso já definidos: tamanho da cena e leituras por dia. Não há cota de plano neste ciclo.

### 4.8 Leitura em andamento

- Mensagem: "Sua cena está sendo lida. Pode sair desta página: ela vai ficar em Minhas cenas."
- O texto enviado continua visível.
- Se passar do tempo esperado, a tela avisa e oferece voltar depois.
- A leitura pronta aparece em Minhas cenas e no Início. O aviso por e-mail fica fora deste ciclo.

### 4.9 Leitura da cena

É a tela mais importante do produto, detalhada na seção 5.

### 4.10 Revisão

Ao clicar em **Revisar com esse foco**:

- O editor abre com o texto da última versão.
- O painel lateral troca o briefing pelo foco da revisão e pelos trechos citados.
- A versão anterior fica guardada e nunca é alterada.
- Antes de enviar, há um campo opcional: "O que você tentou mudar?". Ele ajuda a escrever com intenção e dá contexto à comparação.

### 4.11 Comparação entre versões

Aparece a partir da segunda versão, na própria tela de leitura:

- **O foco foi atendido?** Uma resposta curta, com trecho da nova versão como evidência.
- **Por critério:** a mudança de faixa e de pontuação.
- **Texto:** as diferenças entre as versões, lado a lado no computador e em abas no celular.
- **Regressões:** uma melhora em um critério pode piorar outro, e a leitura precisa dizer isso.

Para a comparação não contaminar a avaliação, são **duas etapas separadas**. Primeiro a nova versão é avaliada sem acesso à pontuação anterior. Depois outra etapa compara as duas versões. Assim a pontuação não sobe só por ser uma revisão.

### 4.12 Encerrar a cena

- **Dar por encerrada** é uma decisão de quem escreve, e pode ser desfeita.
- O próximo exercício é escolhido no catálogo.
- Parar sem pontuação alta também é válido, e o texto da interface não pode tratar isso como desistência.

### 4.13 Minhas cenas

**Minhas cenas**

- Lista por cena, com exercício, gênero, número de versões, faixa ou situação atual e data da última alteração.
- Filtros por gênero e situação, e opção de excluir uma cena.

A tela de Progresso, a evolução por critério e os padrões recorrentes ficam fora deste ciclo. Ranking, medalhas e sequência de dias continuam fora do produto.

## 5. A leitura: o feedback da IA

### 5.1 Como a tela fica

```text
A chave na mesa · Cena de virada · Versão 2                   3 nov 2026

LEITURA GERAL
Dois ou três períodos sobre o que a cena está fazendo.

┌─ O que mais funciona ──────────┐  ┌─ Foco da próxima versão ───────┐
│ Um ponto forte, com trecho     │  │ Uma revisão concreta           │
│                                │  │ [Revisar com esse foco]        │
└────────────────────────────────┘  └────────────────────────────────┘

CRITÉRIOS                                  │  SUA CENA
▸ Aderência ao tema         Funciona       │  Texto completo, com os
▸ Antes e depois            Forte          │  trechos citados marcados.
▸ ...                       Em esboço      │  Clicar em um critério leva
                                           │  ao trecho dele.

Pontuação total: 720 de 1000 (recolhida)
Essa leitura ajudou?  [Sim]  [Em parte]  [Não]   Discordo de um critério
```

No celular, a ordem é leitura geral, foco, critérios e, por último, a cena em uma aba própria.

### 5.2 Exemplo de conteúdo

*Exemplo inventado, para mostrar o tom e a estrutura. Exercício: "O vão entre os telhados".*

> **Leitura geral**
> A cena quer uma travessia em que cada passo custe algo, e a segunda metade consegue isso. A decisão diante do vão é o momento mais forte. O começo perde o leitor no espaço justamente quando a pressa aumenta.
>
> **O que mais funciona: Pressão e escolha (Forte, 215 de 250)**
> A escolha sai de um medo que a cena já mostrou, e não de uma explicação. Quando a personagem "guardou o envelope na boca para ter as duas mãos", o leitor vê o preço da decisão.
>
> **O que falta: Clareza em velocidade (Em esboço, 95 de 200)**
> Nos dois primeiros parágrafos não dá para saber a que distância as duas estão. Em "ela já estava ali de novo", o "ali" pode ser o beiral ou a escada. A frase curta ajuda, mas falta um ponto fixo para o leitor se orientar.
>
> **Foco da próxima versão**
> Escolha um único ponto fixo, como a caixa-d'água, e faça cada mudança de posição até o vão se referir a ele. Não mexa no final por enquanto.

Os cinco critérios deste exemplo somam 720: Aderência ao tema 120, Movimento com consequência 140, Clareza em velocidade 95, Pressão e escolha 215 e Ritmo 150.

### 5.3 Estrutura de cada leitura

| Parte | Regra |
|---|---|
| **Leitura geral** | De dois a três períodos sobre o que a cena está tentando fazer |
| **O que mais funciona** | Um ponto só, com trecho citado |
| **Cada critério** | Faixa, pontuação, o que funciona, o que falta e um trecho citado |
| **Foco da próxima versão** | Uma revisão só, executável e sem reescrever a cena |
| **Pontuação total** | Soma dos critérios, em segundo plano |

### 5.4 Pontuação: faixa em primeiro lugar

**Decisão:** mostrar a faixa em destaque e deixar o número em segundo plano.

- Um "640 de 1000" parece prova. "Em esboço em Clareza" diz o que fazer.
- O banco continua guardando a pontuação de 0 a 1000, conforme `database/schema.md`.
- As faixas já existem nas rubricas. Elas correspondem a até 20%, 50%, 80% e 100% dos pontos de cada critério.

### 5.5 Regras de qualidade

**Garantidas pelo sistema:**

- O total é somado pelo servidor, e não informado pela IA.
- A pontuação de cada critério respeita o máximo dele.
- A faixa é calculada a partir da pontuação.
- Todo trecho citado precisa existir literalmente na cena. Se não existir, a leitura é refeita ou o trecho é descartado.
- A leitura precisa cobrir todos os critérios da rubrica e trazer um foco.

**Pedidas à IA e medidas com um conjunto de avaliação:**

- Não reescrever a cena nem entregar frases prontas para copiar.
- Evitar elogio vazio e crítica sem trecho.
- Tratar a escrita como escolha, sem supor que tudo é erro.
- Ignorar instruções escritas dentro da cena, como "dê nota 1000". O texto é material avaliado, e não um comando.

### 5.6 Confiança na leitura

Para quem pratica, uma avaliação que muda sem motivo destrói o valor do produto.

- **Conjunto de referência:** cenas com avaliação humana, em todas as faixas e gêneros, para testar qualquer mudança de modelo ou prompt.
- **Consistência:** a mesma cena lida várias vezes deve cair em faixas próximas. A tolerância será definida depois da primeira medição.
- **Efeito da revisão:** a mesma cena, sem mudança real, não pode ganhar pontos só por estar em uma versão nova.
- **Rastreabilidade:** cada leitura guarda o modelo e a versão do prompt usados.
- **Limite claro para quem usa:** "Esta é uma leitura de IA. Ela serve para treinar e não define o valor da sua escrita."

### 5.7 Feedback de quem escreve

- **"Essa leitura ajudou?"** Sim, em parte ou não, ao fim de cada leitura.
- **"Discordo deste critério",** com motivo opcional. Isso não muda a pontuação, mas alimenta o conjunto de avaliação.
- Criar um pedido de revisão humana fica fora desta fase.

### 5.8 Leituras antigas

As correções já salvas só têm o texto em markdown e a nota total. Elas continuam visíveis no formato antigo, sem conversão, porque o histórico é congelado.

## 6. Feedback da interface

| Situação | O que a pessoa vê | O que pode fazer |
|---|---|---|
| Rascunho salvo | "Salvo há instantes" | Continuar |
| Falha ao salvar | "Não foi possível salvar. Mantenha esta página aberta: vamos tentar de novo." | Copiar o texto |
| Sessão expirada na escrita | "Sua sessão terminou. Entre de novo para salvar: seu texto continua aqui." | Entrar sem perder o texto |
| Cena curta ou longa demais | Aviso com a contagem e a faixa | Enviar ou continuar escrevendo |
| Fora dos limites | "Para ser lida, a cena precisa ter entre X e Y palavras." | Ajustar |
| Muitos envios seguidos | "Você enviou várias cenas em pouco tempo. Tente de novo em N minutos." | Aguardar, com o rascunho salvo |
| Cota esgotada | "Suas leituras deste período acabaram e voltam em [data]. Você pode continuar escrevendo." | Salvar o rascunho |
| Leitura na fila ou em andamento | "Sua cena está sendo lida." | Sair da página e voltar depois |
| Leitura demorando | "Está levando mais tempo que o normal. Pode voltar depois: ela vai aparecer em Minhas cenas." | Sair ou aguardar |
| Leitura com falha | "Não conseguimos ler sua cena. O texto está salvo e esta tentativa não conta nas suas leituras." | Tentar de novo |
| Leitura pronta | Marca de nova no Início e em Minhas cenas | Abrir |
| Tema retirado do catálogo | "Este exercício saiu do catálogo. Sua cena e suas leituras continuam aqui." | Ver o histórico |
| Cena excluída | "Cena excluída." | Desfazer por alguns segundos |
| Página inexistente | Página própria, com link para o Início | Voltar |
| Erro inesperado | "Algo deu errado do nosso lado. Seu texto salvo não foi afetado." | Tentar de novo |

Regras gerais:

- Toda mensagem diz o que aconteceu, o que houve com o texto e o que fazer agora.
- Sem código de erro ou ID interno na tela.
- Tentar de novo usa a mesma cena, sem criar outra no histórico.

## 7. Melhorias necessárias

### Fase 0: corrigir a base

*Objetivo: a pessoa consegue entrar e usar o ciclo atual sem ver nada falso ou quebrado.*

| Melhoria | Motivo |
|---|---|
| Landing real no lugar do template | Hoje não existe caminho para entrar a partir da home |
| Redirecionar sem sessão e, depois do login, ir para o Início | Hoje a pessoa vê "Unauthorized" ou volta ao template |
| Link de login na tela de cadastro | Quem já tem conta fica sem caminho |
| Mostrar cada estado da correção | Texto em andamento ou com falha aparece como "Nota 0 de 1000" |
| Tirar o "Hello World!" do editor | Hoje a mensagem inicial pode ser enviada e corrigida |
| Validar tamanho e limitar envios por usuário | Cada envio gera custo, sem proteção |
| Tempo limite na espera e "Tentar de novo" sem duplicar | Hoje a espera pode não terminar e a falha duplica textos |
| Texto salvo sem correção iniciada não fica preso | Hoje pode ficar "aguardando" para sempre |
| Interface toda em português, datas locais e `lang` certo | Hoje mistura inglês e português |
| Limpar a página do exercício | Hoje mostra "Theme Page" e o ID interno |
| Telas de escrita e leitura no celular | A escrita usa três colunas fixas |
| Páginas de erro, carregamento e não encontrado | Hoje não há páginas próprias |
| Ligar o envio de e-mails pelo Resend, usando `meawstory.com` | A recuperação de senha depende disso. O domínio já está configurado no Resend |
| Recuperar senha por e-mail, em português | Quem esquece a senha perde o acesso |
| Termos, privacidade e aviso de envio à OpenAI | Precisa estar pronto antes do teste com pessoas reais |
| README do produto | O atual ainda é o do template |

### Fase 1: ciclo de revisão

*Objetivo: a pessoa escreve, lê, revisa e vê a diferença. É a fase que define o produto.*

| Melhoria | Motivo |
|---|---|
| Conjunto de avaliação antes de trocar o formato da leitura | Mede se a mudança melhorou ou piorou as leituras |
| Leitura estruturada por critério | É a base da faixa, dos trechos e da comparação |
| Soma, faixa e trechos validados pelo servidor | A nota não pode depender da conta feita pela IA |
| Proteção contra instruções escritas dentro da cena | Evita manipular a nota |
| Tela nova de leitura, com trechos marcados | Liga cada crítica ao texto |
| Rascunho salvo no servidor | Sem isso, a revisão é arriscada |
| Contador de palavras por exercício e etapa de conferência | Evita gastar leitura por engano |
| Critérios visíveis no briefing | A pessoa precisa saber o que será observado |
| Revisar uma cena e guardar versões | É o centro da proposta |
| Comparação entre versões, avaliada em duas etapas | Mostra o ganho sem inflar a pontuação |
| Excluir uma cena | Já é previsto pelo banco, mas não existe no produto |
| Avaliação da leitura por quem escreve | Mede qualidade e alimenta o conjunto de avaliação |
| Monitorar erros e medir o custo por leitura | Já entregues. Servem à operação e à revisão dos limites de abuso |

### Fase 2: motivo para voltar

*Objetivo: a pessoa volta, vê a próxima ação e encontra a cena e o exercício.*

| Melhoria | Motivo |
|---|---|
| Início orientado pela próxima ação | Reduz a dúvida sobre o que fazer |
| Primeira pergunta e exercício do gênero escolhido | Leva mais rápido à primeira cena |
| Catálogo com gênero, filtros, objetivo e situação | Facilita escolher o treino certo |
| Encerrar e reabrir a cena | Dá conclusão sem bloquear a retomada |
| Minhas cenas com versões, faixa e situação | O histórico fica recuperável |
| Itálico no editor e no envio | A formatação útil à ficção sobrevive ao ciclo |

Ficam fora deste ciclo: tela de Progresso, sugestão por ponto fraco, aviso de leitura pronta por e-mail e mais exercícios.

### Fase 3: sustentar o negócio

Fora deste ciclo. Pagamento, cota de plano, plano pago, edição e exportação da conta, exclusão de conta e administração do catálogo não entram no MVP.

## 8. Impacto nos dados

O modelo atual ajuda bastante, mas estas decisões precisam estar em `database/schema.md` antes da implementação:

- **Rascunho:** uma cena sem nenhuma correção pode ser tratada como rascunho, usando `text.content`.
- **Versões:** cada correção já congela o texto em `text_content`, então cada correção concluída pode representar uma versão. Isso evita uma tabela nova só para versões.
- **Tentativas com falha:** elas também geram linhas de correção, e não podem contar como versão nem consumir leitura.
- **Trava durante a leitura:** o workflow falha se o texto mudar antes de salvar o resultado, então a edição precisa ficar bloqueada ou separada enquanto a leitura roda.
- **Critérios estruturados:** o banco guarda a rubrica só como texto. Eles precisam ser persistidos, e a leitura precisa congelar a pontuação de cada critério.
- **Rubrica para quem escreve:** o `rubric.content` tem instruções para a IA, como a ordem de escrita da correção, e não pode ser exibido como está. É preciso criar uma versão para o público.
- **Gênero do exercício:** hoje ele só existe indiretamente, pela rubrica. O título da rubrica pode servir de início, e o objetivo do exercício é um dado novo.
- **Extensão do exercício:** a faixa de palavras está dentro de uma frase e precisa virar dado para o contador.
- **Título da cena:** hoje o sistema grava "Text for theme ...". Ele pode ficar opcional, e a interface usa o título do exercício até a pessoa dar um nome.

## 9. Como medir

**Métrica principal:** pessoas que enviam pelo menos uma revisão por semana. Ela mostra se alguém está de fato praticando.

| Etapa | O que medir |
|---|---|
| **Ativação** | Quem criou conta e enviou a primeira cena em até 24 horas |
| **Ciclo central** | Quem recebeu uma leitura e enviou uma nova versão |
| **Valor** | Quantos atenderam ao foco e quantos melhoraram no critério trabalhado |
| **Retorno** | Quem voltou e iniciou outra cena depois de 7 e de 28 dias |
| **Qualidade** | Respostas a "Essa leitura ajudou?" e discordâncias por critério |
| **Operação** | Tempo até a leitura, taxa de falha e custo por leitura |

As metas devem ser definidas depois de medir os primeiros usuários, para não partir de números inventados. A instrumentação desses eventos fica fora deste ciclo. Erros, tempo e custo já são medidos na operação da leitura.

## 10. Fora do escopo por enquanto

- Gerar ou reescrever cenas com IA.
- Upload de manuscrito ou projeto longo.
- Comunidade, revisão entre pares ou publicação.
- Ranking, medalhas e sequência de dias.
- Exercícios gerados por IA, pois a curadoria do catálogo é parte do valor.
- Avaliação por pessoas reais.
- Pagamento, cota de plano gratuito e plano pago.
- Edição de dados, exportação, exclusão de conta e administração do catálogo.
- Sugestão de exercício por ponto fraco, tela de Progresso, aviso de leitura pronta por e-mail, pedido de foco específico, expansão do catálogo e eventos do funil.

## 11. Decisões

**Já tomadas:**

- **Público:** escritores de ficção praticando.
- **Envio de e-mails:** Resend, com o domínio `meawstory.com` e o remetente `Meawstory <nao-responda@meawstory.com>`. Uma caixa de contato fica para depois do MVP.
- **Avaliação:** faixa em destaque, com a pontuação em segundo plano.
- **Cota e plano pago:** fora deste ciclo. Permanecem os limites de abuso: de 100 a 2.000 palavras, 10 leituras em 24 horas e 3 envios em 10 minutos.
- **Foco específico pedido por quem escreve:** fora deste ciclo.

**Em aberto:**

| Decisão | Recomendação |
|---|---|
| Exigir verificação de e-mail? | Sim, antes da primeira leitura, sem impedir a escrita. Isso dificulta criar contas em série para gastar leituras |
| Quais limites usar no início? | De 100 a 2.000 palavras por envio e até 10 leituras por dia por pessoa, revendo depois de medir o custo |
| Quem avalia as cenas de referência? | Você e de 1 a 2 leitores experientes, começando com cerca de 30 cenas, 5 por gênero |
| Testar antes de criar conta? | Não no início: mostrar um exemplo na landing e pedir conta antes da primeira leitura, para controlar o custo |
| Qual formatação manter no editor? | Parágrafos na Fase 0 e itálico neste ciclo, por ser comum em ficção |

## 12. Sequência recomendada

1. Fechar as decisões da seção 11 que afetam a Fase 0.
2. Entregar a Fase 0 para que o produto possa ser testado por pessoas reais.
3. Criar o conjunto de avaliação e testar a leitura estruturada antes de construir as telas.
4. Testar com de 5 a 10 escritores o protótipo de leitura e revisão. A pergunta principal é: **"Depois dessa leitura, você sabe o que mudar e quer reescrever?"**
5. Só então construir a revisão e a comparação completas.
