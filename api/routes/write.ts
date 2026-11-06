//* Libraries imports
import { startReading } from "@/services/start-reading"
import { ReadingError, saveScene } from "@/services/reading"
import { sceneSizeError } from "@/lib/reading-policy"
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Services imports
import { themeService } from "@/services/theme"

//* Local imports
import { auth } from "@/lib/auth"

const writeRoutes = new Elysia({ prefix: "/write" }).post(
  "/:themeId",
  async (request) => {
    const { themeId } = request.params
    const { content, textId, draftOnly, title, checklist } = request.body

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      request.set.status = 401
      return {
        message:
          "Sua sessão expirou. Entre na sua conta para enviar a cena. Seu texto continua aqui.",
      }
    }

    if (!draftOnly && sceneSizeError(content)) {
      request.set.status = 400
      return { message: sceneSizeError(content) }
    }

    const activeTheme = await themeService.findThemeById(themeId)

    if (!activeTheme) {
      request.set.status = 404
      return {
        message:
          "Este exercício não está mais disponível. Seu texto continua aqui.",
      }
    }

    let newText
    try {
      newText = await saveScene(session.user.id, themeId, content, textId, {
        title,
        checklist,
      })
    } catch (error) {
      if (!(error instanceof ReadingError)) throw error
      request.set.status = error.status
      return { message: error.message }
    }

    if (draftOnly) return { textId: newText.id }

    //* The scene stays saved. A blocked attempt starts nothing, so it uses no reading.
    if (!session.user.emailVerified) {
      return {
        textId: newText.id,
        readingBlocked: "EMAIL_NOT_VERIFIED" as const,
      }
    }

    try {
      await startReading(session.user.id, newText.id, content)
    } catch (error) {
      if (!(error instanceof ReadingError)) throw error
      request.set.status = error.status
      return {
        textId: newText.id,
        message: error.message,
        retryAt: error.retryAt,
      }
    }

    return { textId: newText.id }
  },
  {
    body: z.object({
      content: z.string().max(200000),
      title: z.string().max(200).optional(),
      checklist: z.array(z.string().max(1000)).max(100).optional(),
      draftOnly: z.boolean().optional(),
      textId: z.string().optional(),
    }),
    params: z.object({
      themeId: z.string(),
    }),
  }
)

export { writeRoutes }
