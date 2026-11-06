import { Elysia } from "elysia"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { saveReadingFeedback } from "@/services/reading-feedback"

export const readingFeedbackRoutes = new Elysia({
  prefix: "/reading-feedback",
}).put(
  "/:correctionId",
  async ({ params, body, set }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      set.status = 401
      return {
        message:
          "Sua sessão expirou. Entre novamente para registrar sua resposta.",
      }
    }
    let saved: boolean
    try {
      saved = await saveReadingFeedback(
        session.user.id,
        params.correctionId,
        body
      )
    } catch {
      // Database errors can contain SQL parameters, including the writer's reason.
      // Only this fixed message may reach the API's global telemetry handler.
      throw new Error("Failed to persist reading feedback.")
    }
    if (!saved) {
      set.status = 404
      return {
        message: "Esta leitura ou critério não está disponível para sua conta.",
      }
    }
    return { saved: true }
  },
  {
    params: z.object({ correctionId: z.string().min(1) }),
    body: z.union([
      z.strictObject({ usefulness: z.enum(["yes", "partly", "no"]) }),
      z.strictObject({
        criterionId: z.string().min(1),
        reason: z.string().trim().max(2000).default(""),
      }),
    ]),
  }
)
