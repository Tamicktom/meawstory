//* Libraries imports
import type { ReactNode } from "react"

//* Components imports
import { MobileNavigation } from "@/components/app/mobile-navigation"
import { AppSidebar } from "@/components/app/sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

//* Local imports
import { requireSession } from "@/lib/session"

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function AppLayout(props: DashboardLayoutProps) {
  await requireSession()

  return (
    <SidebarProvider>
      <style>
        {
          "@media (max-width: 767px) { html { scroll-padding-bottom: 6rem; } }"
        }
      </style>
      <AppSidebar />
      <MobileNavigation />
      <main className="flex min-w-0 flex-1 flex-col items-center justify-start pb-24 md:pb-0">
        <div className="hidden w-full flex-row items-center justify-start p-2 md:flex">
          <SidebarTrigger className="min-h-11 min-w-11" />
        </div>
        {props.children}
      </main>
    </SidebarProvider>
  )
}
