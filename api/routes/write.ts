//* Libraries imports
import { start } from "workflow/api"
import { Elysia } from "elysia"
import { headers } from "next/headers"
import z from "zod"

//* Database imports
import { db } from "@/database"
import { text } from "@/database/schema"

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

    // create text
    const newText = await db
      .insert(text)
      .values({
        id: Bun.randomUUIDv7(),
        userId: session.user.id,
        title: `Text for theme ${themeId}`,
        content,
        themeId,
      })
      .returning()

    await start(correctText, [newText[0].id])

    return { textId: newText[0].id }
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
