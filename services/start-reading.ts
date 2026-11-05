import { start } from "workflow/api"
import { correctText } from "@/workflows/correction"
import { reserveReading } from "@/services/reading"
import { correctionService } from "@/services/correction"
export async function startReading(userId: string, textId: string) {
  const id = await reserveReading(userId, textId)
  try {
    await start(correctText, [textId, id])
  } catch {
    await correctionService.updateCorrectionStatus(id, "FAILED")
    // Return the saved scene so the person can retry without creating another.
  }
}
