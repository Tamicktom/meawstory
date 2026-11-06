"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/session"

export async function refreshAuthenticatedRoutes() {
  await requireSession()
  // API-issued auth cookies do not invalidate Next's prefetched redirects.
  revalidatePath("/dashboard", "layout")
}
