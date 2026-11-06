import { db } from "@/database"
import { requireSession } from "@/lib/session"
import { textService } from "@/services/text"
import { DashboardHome } from "./home"

export default async function DashboardPage() {
  const session = await requireSession()
  const [account, scenes] = await Promise.all([
    db.query.user.findFirst({
      columns: { onboardingCompletedAt: true },
      where: { id: session.user.id },
    }),
    textService.listOwnedTexts(session.user.id),
  ])
  return (
    <DashboardHome
      scenes={scenes}
      onboardingComplete={Boolean(account?.onboardingCompletedAt)}
    />
  )
}
