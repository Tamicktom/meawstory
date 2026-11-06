# 1C-5 · Monitorar erros e operação da leitura

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Sustentar o teste com escritores e identificar falhas antes que pareçam perda de texto.

## Escopo
- Escolher a ferramenta de monitoramento.
- Monitorar erros da aplicação, API e workflows.
- Medir tempo até a leitura e taxa de falha.
- Distinguir fila, processamento, atraso e falha definitiva.
- Relacionar erros ao modelo e à versão do prompt sem expor dados técnicos na interface.
- Alertar sobre aumento anormal de falhas ou duração.

## Critérios de conclusão
- Uma falha pode ser localizada por etapa e o tempo e a taxa de falha podem ser acompanhados ao longo do tempo.

## Dependências
- [0C-6 · Definir tempo limite para a espera da leitura](../fase-0-base/0C-6-definir-tempo-limite-da-espera.md)
- [1B-5 · Registrar modelo e versão do prompt em cada leitura](1B-5-registrar-modelo-e-versao-do-prompt.md)

## Resultado

**Ferramenta escolhida em 2026-11-05, por Tamicktom: monitoramento próprio, no banco, sem fornecedor novo.**

- **Etapas e tempos:** cada tentativa registra quando o workflow a pegou (`started_at`) e quando terminou (`finished_at`). A falha registra a etapa (`failure_stage`) e o motivo interno (`failure_reason`): `dispatch`, `queue_timeout`, `processing_timeout`, `admission`, `grading`, `validation` e `saving`. Assim se distinguem fila (PENDING), processamento (IN_PROGRESS), atraso (ativa há mais de 2 minutos) e falha definitiva. Os campos ficam fora das consultas da interface.
- **Erros:** logs estruturados, um objeto JSON por linha (`lib/telemetry.ts`), nos logs da Vercel. Cobrem os workflows (`reading.queued`, `reading.started`, `reading.call`, `reading.completed`, `reading.failed`), os erros inesperados da API (`api.error`), os erros do servidor do Next.js (`app.server_error`, via `instrumentation.ts`) e os erros mostrados pelas páginas de erro no navegador (`app.client_error`). Cada evento de leitura traz modelo e versão do prompt. Os logs não trazem texto da cena nem da leitura.
- **Acompanhamento:** `bun run ops:report --since 7d` mostra tentativas, taxa de falha, falhas por etapa, tempo de fila e tempo até a leitura (p50, p95 e máximo), por modelo e versão do prompt e dia a dia.
- **Alertas:** depois de cada tentativa terminada, a cada reconciliação de tempo esgotado e uma vez por dia (cron da Vercel em `/api/ops/reading-health`, protegido por `CRON_SECRET`), o servidor confere a última hora (24 horas no cron). Alerta quando a taxa de falha chega a 20% com pelo menos 5 tentativas terminadas, quando o p95 do tempo até a leitura passa de 2 minutos com pelo menos 5 leituras, ou quando 3 tentativas esperam há mais de 2 minutos. Cada tipo de alerta é enviado no máximo uma vez por hora, por e-mail para `OPS_ALERT_EMAIL` e sempre como `ops.alert` no log.

**Para operar:** configurar `OPS_ALERT_EMAIL` e `CRON_SECRET` na Vercel. O cron diário cabe no plano Hobby; os alertas que importam no teste com escritores saem logo depois de cada tentativa, sem depender do cron. Os limites são um ponto de partida e devem ser revistos com os dados do teste.
