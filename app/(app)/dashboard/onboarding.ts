"use server"

import { and, eq, isNull } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/database"
import { user } from "@/database/schema"
import { requireSession } from "@/lib/session"
import { GENRE_LABEL } from "@/lib/reading-contract"
import { themeService } from "@/services/theme"

export async function completeOnboarding(data: FormData) {
  const session = await requireSession()
  const genre = data.get("genre")
  if (
    typeof genre !== "string" ||
    (genre !== "skip" && !Object.hasOwn(GENRE_LABEL, genre))
  )
    throw new Error("Escolha um objetivo válido.")
  const catalog =
    genre === "skip" ? [] : await themeService.listCatalog(session.user.id)
  const suggested = catalog
    .filter((exercise) => exercise.genre === genre)
    .toSorted((a, b) => a.id.localeCompare(b.id))[0]
  await db
    .update(user)
    .set({ onboardingCompletedAt: new Date() })
    .where(
      and(eq(user.id, session.user.id), isNull(user.onboardingCompletedAt))
    )
  redirect(
    suggested ? `/dashboard/themes/${suggested.id}` : "/dashboard/themes"
  )
}
