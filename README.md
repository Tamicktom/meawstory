# Meawstory

Um espaço para treinar ficção: escolha um exercício, escreva uma cena e receba uma leitura por IA baseada nos critérios daquele exercício. A leitura e a pontuação ajudam a decidir o que revisar; a autoria e as decisões sobre o texto continuam com quem escreve.

A versão atual permite criar conta, recuperar senha, confirmar o e-mail, enviar uma cena, acompanhar a leitura e reencontrá-la em **Minhas cenas**, no computador e no celular. A revisão é feita pela pessoa autora; versões, comparação de revisões e acompanhamento de progresso fazem parte das próximas fases do [plano V2](docs/v2/00-card-pai.md).

## Ambiente de desenvolvimento local

Pré-requisitos: [Bun](https://bun.sh), Node.js 20.9 ou superior (para executar o Next.js), Docker com Compose e Git. O banco local é PostgreSQL 18.

```bash
git clone https://github.com/Tamicktom/meawstory.git
cd meawstory
bun install --frozen-lockfile
cp example.env .env
```

Configure `.env` a partir de [example.env](example.env):

| Variável                  | Configuração                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_VERCEL_URL`  | URL da aplicação, com protocolo no ambiente local: `http://localhost:3000`. Usada em autenticação e links de e-mail.                |
| `BETTER_AUTH_SECRET`      | Segredo aleatório; gere, por exemplo, com `openssl rand -hex 32`.                                                                   |
| `DATABASE_URL`            | O exemplo usa `postgresql://postgres:postgres@localhost:5432/postgres`.                                                             |
| `OPENAI_API_KEY`          | Chave do projeto da OpenAI para leituras reais. A validação do ambiente exige um valor; o placeholder do exemplo não gera leituras. |
| `RESEND_API_KEY`          | Obrigatória em produção; dispensada no desenvolvimento e nos testes.                                                                |
| `WORKFLOW_WEBHOOK_SECRET` | Pode ficar vazia no desenvolvimento local; configure conforme o ambiente de execução do Workflow quando ele a exigir.               |
| `OPS_ALERT_EMAIL`         | Opcional. Recebe os alertas de falha e de atraso das leituras; sem ela, os alertas ficam só no log.                                 |
| `CRON_SECRET`             | Opcional, com pelo menos 16 caracteres. A Vercel a envia ao cron diário de saúde das leituras (`/api/ops/reading-health`).          |

Não versione `.env` nem chaves. Em produção na Vercel (`VERCEL_ENV=production`), a autenticação e os links de e-mail usam `https://meawstory.com`. Fora dela, usam a URL configurada.

Em desenvolvimento, os e-mails não passam pelo Resend: cada um fica em `.email-outbox/`, e o terminal mostra o caminho do arquivo. Em produção, `RESEND_API_KEY` é obrigatória. Para testar um envio real, preencha a chave no `.env` e execute `bun run email:test seu@email.com`.

Prepare o PostgreSQL 18 e os dados iniciais:

```bash
docker compose up -d --wait
bun run db:migrate
bun run db:seed
bun run dev
```

Acesse <http://localhost:3000>. `bun run dev` também executa `docker compose up -d`, mas não aplica migrações nem seed. O Next.js deve rodar sobre Node; não use `bun --bun` para iniciá-lo. Os dados persistem no volume Docker `postgres_data`.

Conta de teste: `user@user.user`, senha `123123Qq!`. O seed cria ou atualiza essa conta, 6 rubricas e 12 temas.

O seed redefine a senha dessa conta e marca seu e-mail como confirmado. Use-a somente no ambiente local. Contas novas podem entrar e salvar cenas sem confirmar o e-mail, mas precisam confirmá-lo para iniciar uma leitura.

Para parar os serviços, encerre o Next.js com Ctrl+C e execute `docker compose stop`.

Caso o banco já esteja rodando fora do Docker, aplique migrações e seed na URL correspondente e inicie apenas o Next.js:

```bash
bunx next dev --hostname 0.0.0.0 --port 3000
```

No Cursor Cloud, use o PostgreSQL instalado e as instruções de [AGENTS.md](AGENTS.md#cursor-cloud); Docker não está disponível nesse ambiente.

Na Vercel, `vercel.json` define o comando `bun run db:migrate && bun run build`, sobrescrevendo o comando de build do painel, conforme a [configuração da Vercel](https://vercel.com/docs/project-configuration/vercel-json#buildcommand). As migrações pendentes são aplicadas antes de o Next.js consultar o banco na pré-renderização. O deploy preserva os dados existentes; reset e seed da conta de teste ficam no desenvolvimento local.

## Leituras e dados

Cada cena deve ter de 100 a 2.000 palavras. Os limites são 10 leituras por pessoa em uma janela móvel de 24 horas e 3 em 10 minutos; tentativas que falham não consomem a cota. Após 2 minutos há um aviso de demora; após 10, a tentativa pode ser retomada como falha recuperável. Uma nova tentativa reutiliza a cena salva.

As leituras atuais usam a Responses API da OpenAI com `gpt-5-mini` e `store: false`. Isso não elimina registros de monitoramento de abuso. O banco e o Workflow também guardam conteúdo das cenas e das leituras. As práticas confirmadas, a confirmação do compartilhamento desativado e as limitações de retenção estão no [registro 0A-3](docs/v2/fase-0-base/0A-3-confirmar-uso-de-dados-pela-openai.md).

Os documentos públicos estão em `/termos` e `/privacidade`, com links antes do cadastro e dos envios. O teste é destinado a maiores de 18 anos convidados. Pedidos sobre dados usam o canal do convite; exportação e exclusão pela interface ainda não estão implementadas. Confira as pendências operacionais no [card pai](docs/v2/00-card-pai.md#e-preparação-para-pessoas-reais) antes de convidar pessoas.

## Validação

Use um banco local de desenvolvimento com migrações e seed aplicados. Os testes criam contas e dados nesse banco; não os aponte para produção.

```bash
bunx playwright install --with-deps chromium
bun test
bun run typecheck
bun run test:e2e
bun run test:ct
```

`bun test` executa a suíte em `tests/unit`, incluindo testes que acessam o PostgreSQL. `bun run test` executa essa suíte e os dois projetos Playwright, declarados em [playwright.config.ts](playwright.config.ts):

- `bun run test:e2e`: jornadas em `tests/e2e`, contra `http://localhost:3000`. O Playwright inicia `bun run dev` se não houver um servidor nessa URL; sem Docker, inicie o Next.js manualmente antes.
- `bun run test:ct`: componentes em `tests/components`, servidos pela galeria Vite na porta 3100.

O Playwright inicia os servidores declarados na configuração quando necessário. As jornadas criam uma conta nova a cada execução. Para iniciar leituras, os testes confirmam o e-mail com `tests/helpers/email-outbox.ts`. Durante o Playwright, uma leitura salva substitui a chamada ao modelo, sem alcançar a OpenAI.

Para validar e executar um build de produção:

```bash
bun run build
bun run start
```

`RESEND_API_KEY` precisa estar preenchida para o build porque o ambiente de produção a valida. Um valor fictício serve apenas para verificar o build local; para operar o serviço, use credenciais válidas. O build não envia e-mails. `bun run lint` está disponível, mas há uma incompatibilidade conhecida do `typescript-eslint` com o TypeScript 7 fixado no projeto. `bun run doctor` executa o React Doctor.

## Avaliação das leituras

O conjunto de referência em [`evaluation/reference`](evaluation/reference/README.md) tem 37 cenas, 6 revisões, 1 controle e 3 casos com instruções ao corretor, nos seis gêneros da rubrica. Antes de trocar modelo, prompt ou formato da leitura, meça a configuração nova com `bun run eval:baseline` e compare o relatório gerado por `bun run eval:report` com a [linha de base atual](evaluation/reference/baselines/2026-11-05-atual-v2/report.md). `bun run eval:forms` gera o material da avaliação humana.

## Operação das leituras

A leitura é estruturada por critério: o servidor confere a cobertura dos critérios e as citações, calcula faixas e total e pede de novo uma vez quando rejeita a resposta. Cada tentativa registra fila, processamento, etapa da falha e o custo de cada chamada ao modelo. `bun run ops:report --since 7d` mostra tempo até a leitura, taxa de falha por etapa e custo por leitura concluída. Os logs saem como JSON, uma linha por evento, sem texto das cenas. Alertas de falha e atraso vão para `OPS_ALERT_EMAIL`. As regras estão em [database/schema.md](database/schema.md#reading-engine-monitoring-and-cost-phase-1-c).

## Banco de dados

Leia [database/schema.md](database/schema.md) antes de alterar tabelas, consultas, exclusões, seeds ou comportamento da leitura. Ele define exclusão lógica, cascatas e os dados congelados em cada leitura. [database/schema.ts](database/schema.ts) é a definição Drizzle; `database/migrations` guarda o SQL.

Para alterar o schema, use `bun run db:generate`, revise o SQL e aplique com `bun run db:migrate`. Use `bun run db:seed` para atualizar o catálogo e a conta de teste. `bun run db:studio` abre a interface de inspeção do banco.

**Reset destrutivo local:** `bun run db:migrate:fresh` apaga todos os schemas não sistêmicos do banco Docker local e reaplica as migrações. Depois desse reset, execute o seed novamente.

## Estrutura e documentação

- `app/(app)/dashboard`: telas que exigem sessão.
- `app/api/[[...slugs]]`: API HTTP em Elysia; `app/api/auth/[...all]`: autenticação Better Auth.
- `services`: operações do domínio; `workflows/correction.ts`: processamento da leitura.
- `database/seed`: catálogo e conta local.
- `evaluation`: conjunto de referência, medição e relatório das leituras.
- `components`, `hooks` e `schemas`: interface, estado do cliente e validação.

O [card pai V2](docs/v2/00-card-pai.md) concentra o andamento, as decisões e os critérios de cada fase. A [visão de produto](docs/produto-fluxo-novo.md) explica a direção de treino, leitura e revisão. As convenções de desenvolvimento e as instruções específicas desta versão do Next.js estão em [AGENTS.md](AGENTS.md).
