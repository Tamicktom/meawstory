import { start } from "workflow/api"
import { correctText } from "@/workflows/correction"
import { reserveReading } from "@/services/reading"
import { correctionService } from "@/services/correction"
import { errorMessage, logEvent } from "@/lib/telemetry"
export async function startReading(
  userId: string,
  textId: string,
  expectedContent?: string
) {
  const id = await reserveReading(userId, textId, expectedContent)
  try {
    await start(correctText, [textId, id])
    logEvent("info", "reading.queued", { correctionId: id })
  } catch (error) {
    await correctionService.updateCorrectionStatus(id, "FAILED", {
      stage: "dispatch",
      reason: errorMessage(error),
    })
    logEvent("error", "reading.failed", {
      correctionId: id,
      stage: "dispatch",
      reason: errorMessage(error),
    })
    // Return the saved scene so the person can retry without creating another.
  }
}
