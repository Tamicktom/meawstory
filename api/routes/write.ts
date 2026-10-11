//* Libraries imports
import { start } from "workflow/api"
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Services imports
import { textService } from "@/services/text"

//* Workflow import
import { correctText } from "@/workflows/correction"

//* Local imports
import { auth } from "@/lib/auth"

const writeRoutes = new Elysia({ prefix: "/write" }).post(
  "/:themeId",
  async (request) => {
    const { themeId } = request.params
    const { content } = request.body

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      request.set.status = 401
      return { message: "Unauthorized" }
    }

    const newText = await textService.createText({
      userId: session.user.id,
      themeId,
      content,
    })

    await start(correctText, [newText.id])

    return { textId: newText.id }
  },
  {
    body: z.object({
      content: z.string(),
    }),
    params: z.object({
      themeId: z.string(),
    }),
  }
)

export { writeRoutes }
