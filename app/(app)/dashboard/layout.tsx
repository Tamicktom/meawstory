//* Libraries imports
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { ReactNode } from "react";

//* Components imports
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";


type DashboardLayoutProps = {
  children: ReactNode;
}

export default async function DashboardLayout(props: DashboardLayoutProps) {

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <div>
      <h1>Unauthorized</h1>
    </div>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {props.children}
      </main>
    </SidebarProvider>
  )
}