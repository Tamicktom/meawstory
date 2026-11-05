# Meawstory

Aplicação Next.js para escrever textos a partir de temas e receber correções por IA.

## Ambiente de desenvolvimento local

Pré-requisitos: Bun e Docker com Compose.

```bash
bun install --frozen-lockfile
cp example.env .env
```

No `.env`, preencha `BETTER_AUTH_SECRET` com um segredo aleatório (por exemplo, gere com `openssl rand -hex 32`) e `OPENAI_API_KEY` com sua chave. A chave OpenAI é necessária para gerar correções reais. Os valores de URL e banco do exemplo já apontam para o ambiente local.

Prepare o PostgreSQL 18 e os dados iniciais:

```bash
docker compose up -d --wait
bun run db:migrate
bun run db:seed
bun run dev
```

Acesse <http://localhost:3000>. O comando dev também inicia o banco e espera ele ficar saudável. Os dados persistem no volume Docker `postgres_data`.

Conta de teste: `user@user.user`, senha `123123Qq!`. O seed cria ou atualiza essa conta, 6 rubricas e 12 temas.

Para parar os serviços, encerre o Next.js com Ctrl+C e execute `docker compose stop`.

## Validação

```bash
bun test
bun run typecheck
bunx playwright install chromium
bun run test:e2e
bun run test:ct
```

`bun run test` executa os testes unitários e os projetos Playwright. O Playwright inicia os servidores necessários quando estão desligados.

## Banco de dados

Leia `database/schema.md` antes de alterar o banco. Use `bun run db:migrate` para aplicar migrações e `bun run db:seed` para atualizar o catálogo e a conta de teste.

`bun run db:migrate:fresh` apaga os schemas do banco local e reaplica as migrações. Depois desse reset, execute o seed novamente.
