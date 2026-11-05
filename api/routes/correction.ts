//* Libraries imports
import { start } from "workflow/api"
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Local imports
import { auth } from "@/lib/auth"

//* Services imports
import { correctionService } from "@/services/correction"
import { textService } from "@/services/text"

//* Workflow import
import { correctText } from "@/workflows/correction"

const correctionRoutes = new Elysia({ prefix: "/correction" })
  .get(
  "/check-correction-status/:textId",
  async (request) => {
    const { textId } = request.params

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      request.set.status = 401
      return { message: "Unauthorized" }
    }

    const ownedText = await textService.findOwnedText(textId, session.user.id)

    if (!ownedText) {
      request.set.status = 404
      return { message: "Text not found" }
    }

    const correction = await correctionService.findLatestActiveCorrection(
      ownedText.id
    )

    return {
      status: correction?.status ?? "PENDING",
    }
  },
  {
    params: z.object({
      textId: z.string(),
    }),
  }
)
  //* Starts the reading of a scene saved before its author confirmed the email.
  .post(
    "/start/:textId",
    async (request) => {
      const { textId } = request.params

      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session) {
        request.set.status = 401
        return { message: "Unauthorized" }
      }

      const ownedText = await textService.findOwnedText(textId, session.user.id)

      if (!ownedText) {
        request.set.status = 404
        return { message: "Text not found" }
      }

      if (!session.user.emailVerified) {
        request.set.status = 403
        return { message: "Email not verified" }
      }

      const correction = await correctionService.findLatestActiveCorrection(
        ownedText.id
      )

      if (correction) {
        request.set.status = 409
        return { message: "Reading already started" }
      }

      await start(correctText, [ownedText.id])

      return { textId: ownedText.id }
    },
    {
      params: z.object({
        textId: z.string(),
      }),
    }
  )

export { correctionRoutes }
