//* Libraries imports
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Services imports
import { textService } from "@/services/text"

//* Local imports
import { auth } from "@/lib/auth"

const sceneRoutes = new Elysia({ prefix: "/scenes" })
  .guard({ params: z.object({ textId: z.string().min(1) }) })
  .resolve(async ({ status }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return status(401, {
        message: "Sua sessão expirou. Entre na sua conta para continuar.",
      })
    }
    return { session }
  })
  .post("/:textId/retire", async ({ params, session, set }) => {
    const retired = await textService.retireOwnedScene(
      params.textId,
      session.user.id
    )
    if (retired.status === "missing") {
      set.status = 404
      return { message: "Esta cena não está disponível para sua conta." }
    }
    return { deletedAt: retired.deletedAt.toISOString() }
  })
  .post("/:textId/restore", async ({ params, session, set }) => {
    const restored = await textService.restoreOwnedScene(
      params.textId,
      session.user.id
    )
    if (restored.status === "missing") {
      set.status = 404
      return { message: "Esta cena não está disponível para desfazer." }
    }
    if (restored.status === "expired") {
      set.status = 409
      return { message: "O prazo para desfazer esta exclusão acabou." }
    }
    return { restored: true }
  })

export { sceneRoutes }
