//* Alerts for an abnormal rise in failures or duration (1C-5). The check runs after every
//* finished attempt, after timeouts are reconciled, and once a day from the Vercel cron.
//* Each kind alerts at most once per cooldown while the problem lasts.

//* Libraries imports
import { sql } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { operationAlert } from "@/database/schema"
import { serverEnv } from "@/env/server"
import { READING_DELAY_MS } from "@/lib/reading-policy"
import { errorMessage, logEvent } from "@/lib/telemetry"
import { sendEmail } from "@/services/email"
import {
  readingHealth,
  type ReadingHealth,
} from "@/services/reading-operations"

const ALERT_RULES = {
  //* Finished attempts needed before a rate means anything.
  minimumFinished: 5,
  failureRate: 0.2,
  //* Readings taking longer than the delay notice, at the 95th percentile.
  slowP95Ms: READING_DELAY_MS,
  stalledAttempts: 3,
  cooldownMs: 60 * 60_000,
} as const

export type AlertKind = "failure_rate" | "slow_readings" | "stalled_readings"

export type Alert = { kind: AlertKind; detail: string }

function seconds(ms: number) {
  return `${Math.round(ms / 1000)} s`
}

export function alertsFor(health: ReadingHealth): Alert[] {
  const { total } = health
  const finished = total.completed + total.failed
  const alerts: Alert[] = []

  if (
    finished >= ALERT_RULES.minimumFinished &&
    total.failureRate !== null &&
    total.failureRate >= ALERT_RULES.failureRate
  ) {
    const stages = health.failuresByStage
      .map((entry) => `${entry.stage} ${entry.count}`)
      .join(", ")
    alerts.push({
      kind: "failure_rate",
      detail: `${total.failed} de ${finished} leituras falharam (${Math.round(total.failureRate * 100)}%). Etapas: ${stages}.`,
    })
  }

  if (
    total.completed >= ALERT_RULES.minimumFinished &&
    total.timeToReadingP95Ms !== null &&
    total.timeToReadingP95Ms > ALERT_RULES.slowP95Ms
  ) {
    alerts.push({
      kind: "slow_readings",
      detail: `O percentil 95 do tempo até a leitura foi de ${seconds(total.timeToReadingP95Ms)} em ${total.completed} leituras.`,
    })
  }

  if (total.delayed >= ALERT_RULES.stalledAttempts) {
    alerts.push({
      kind: "stalled_readings",
      detail: `${total.delayed} leituras esperam há mais de ${seconds(READING_DELAY_MS)}.`,
    })
  }

  return alerts
}

//* Claims the alert atomically, so concurrent checks send it once.
async function claim(alert: Alert, now: Date): Promise<boolean> {
  const result = await db
    .insert(operationAlert)
    .values({ kind: alert.kind, lastSentAt: now, detail: alert.detail })
    .onConflictDoUpdate({
      target: operationAlert.kind,
      set: { lastSentAt: now, detail: alert.detail },
      setWhere: sql`${operationAlert.lastSentAt} < ${new Date(now.getTime() - ALERT_RULES.cooldownMs).toISOString()}`,
    })
    .returning({ kind: operationAlert.kind })

  return result.length > 0
}

async function notify(alert: Alert, health: ReadingHealth) {
  logEvent("error", "ops.alert", { kind: alert.kind, detail: alert.detail })
  const to = serverEnv.OPS_ALERT_EMAIL

  if (!to) return

  const period = `${health.since.toISOString()} a ${health.until.toISOString()}`
  const groups = health.groups
    .map(
      (group) =>
        `${group.modelId ?? "?"} ${group.promptVersion?.slice(0, 15) ?? "?"}: ${group.failed} falhas em ${group.completed + group.failed}`
    )
    .join("\n")

  await sendEmail({
    to,
    subject: `[Meawstory] Alerta de leitura: ${alert.kind}`,
    text: `${alert.detail}\n\nPeríodo: ${period}\n\n${groups}\n\nDetalhes: bun run ops:report`,
    html: `<p>${alert.detail}</p><p>Período: ${period}</p><pre>${groups}</pre><p>Detalhes: <code>bun run ops:report</code></p>`,
  })
}

//* Never throws: monitoring must not fail a reading.
export async function checkReadingHealth(windowMs = 60 * 60_000) {
  try {
    const until = new Date()
    const health = await readingHealth({
      since: new Date(until.getTime() - windowMs),
      until,
    })
    const alerts = alertsFor(health)

    await Promise.all(
      alerts.map(async (alert) => {
        if (await claim(alert, until)) await notify(alert, health)
      })
    )

    return alerts
  } catch (error) {
    logEvent("error", "ops.health_check_failed", {
      reason: errorMessage(error),
    })
    return []
  }
}
