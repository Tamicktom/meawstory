//* Libraries imports
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Local imports
import { auth } from "@/lib/auth"

//* Services imports
import { correctionService } from "@/services/correction"
import { textService } from "@/services/text"

const correctionRoutes = new Elysia({ prefix: "/correction" }).get(
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

export { correctionRoutes }
