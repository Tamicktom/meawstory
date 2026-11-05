//* Libraries imports
import { startReading } from "@/services/start-reading"
import { ReadingError } from "@/services/reading"
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Local imports
import { auth } from "@/lib/auth"

//* Services imports
import { correctionService } from "@/services/correction"
import { textService } from "@/services/text"

const correctionRoutes = new Elysia({ prefix: "/correction" })
  .guard({ params: z.object({ textId: z.string() }) })
  .resolve(async ({ params, status }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return status(401, { message: "Unauthorized" })
    }

    const ownedText = await textService.findOwnedText(
      params.textId,
      session.user.id
    )
    if (!ownedText) {
      return status(404, { message: "Text not found" })
    }

    return { session, ownedText }
  })
  .get("/check-correction-status/:textId", async ({ ownedText }) => {
    const correction = await correctionService.findLatestActiveCorrection(
      ownedText.id
    )

    return {
      status: correction?.status ?? "DRAFT",
    }
  })
  //* Starts the reading of a scene saved before its author confirmed the email.
  .post("/start/:textId", async ({ session, ownedText, set }) => {
    if (!session.user.emailVerified) {
      set.status = 403
      return { message: "Email not verified" }
    }

    try {
      await startReading(session.user.id, ownedText.id)
    } catch (error) {
      if (!(error instanceof ReadingError)) throw error
      set.status = error.status
      return { message: error.message, retryAt: error.retryAt }
    }

    return { textId: ownedText.id }
  })

export { correctionRoutes }
