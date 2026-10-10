//* Libraries imports
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { ReactNode } from "react";


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
    <div>
      {props.children}
    </div>
  )
}