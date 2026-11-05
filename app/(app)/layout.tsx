//* Libraries imports
import type { ReactNode } from "react";

//* Components imports
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";

//* Local imports
import { requireSession } from "@/lib/session";

type DashboardLayoutProps = {
  children: ReactNode;
}

export default async function AppLayout(props: DashboardLayoutProps) {
  await requireSession();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full flex flex-col items-center justify-start">
        <div className="w-full flex flex-row items-center justify-start p-2">
          <SidebarTrigger />
        </div>
        {props.children}
      </main>
    </SidebarProvider>
  )
}