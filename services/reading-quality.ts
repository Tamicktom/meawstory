import { sql } from "drizzle-orm"
import { db } from "@/database"

export type QualityWindow = { since: Date; until: Date }
export async function readingQuality({ since, until }: QualityWindow) {
  const result = await db.execute<{
    modelId: string
    promptVersion: string
    readings: number
    responses: number
    yes: number
    partly: number
    no: number
    disputedReadings: number
    disagreements: number
  }>(sql`
    SELECT c.model_id AS "modelId", c.prompt_version AS "promptVersion",
      count(*)::int AS readings, count(f.correction_id)::int AS responses,
      count(*) FILTER (WHERE f.usefulness = 'yes')::int AS yes,
      count(*) FILTER (WHERE f.usefulness = 'partly')::int AS partly,
      count(*) FILTER (WHERE f.usefulness = 'no')::int AS no,
      count(*) FILTER (WHERE d.n > 0)::int AS "disputedReadings",
      coalesce(sum(d.n), 0)::int AS disagreements
    FROM correction c JOIN text t ON t.id = c.text_id
    LEFT JOIN reading_feedback f ON f.correction_id = c.id
    LEFT JOIN LATERAL (SELECT count(*) AS n FROM reading_disagreement WHERE correction_id = c.id) d ON true
    WHERE c.deleted_at IS NULL AND t.deleted_at IS NULL AND c.status = 'COMPLETED'
      AND c.structured_result IS NOT NULL AND c.created_at >= ${since} AND c.created_at < ${until}
    GROUP BY c.model_id, c.prompt_version ORDER BY c.model_id, c.prompt_version
  `)
  return result.rows
}

// Explicit local export for human investigation. No automatic changes to evaluation scenes.
export async function readingQualityCandidates({
  since,
  until,
}: QualityWindow) {
  const result = await db.execute(sql`
    SELECT c.id AS "correctionId", c.model_id AS "modelId", c.prompt_version AS "promptVersion",
      f.usefulness, d.criterion_id AS "criterionId", d.reason
    FROM correction c JOIN text t ON t.id = c.text_id
    LEFT JOIN reading_feedback f ON f.correction_id = c.id
    LEFT JOIN reading_disagreement d ON d.correction_id = c.id
    WHERE c.deleted_at IS NULL AND t.deleted_at IS NULL AND c.status = 'COMPLETED'
      AND c.structured_result IS NOT NULL AND c.created_at >= ${since} AND c.created_at < ${until}
      AND (f.usefulness IN ('partly', 'no') OR d.correction_id IS NOT NULL)
    ORDER BY c.id, d.criterion_id
  `)
  return result.rows
}
