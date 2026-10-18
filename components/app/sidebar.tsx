"use client"

//* Libraries imports
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenIcon, HouseIcon } from "lucide-react"

//* Components imports
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigation = [
  {
    id: "sidebar-dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: HouseIcon,
  },
  {
    id: "sidebar-themes",
    title: "Themes",
    href: "/dashboard/themes",
    icon: BookOpenIcon,
  },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              id="sidebar-brand"
              size="lg"
              render={<Link href="/dashboard" />}
            >
              <span className="font-heading text-sm font-medium">Meawstory</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    id={item.id}
                    isActive={isActivePath(pathname, item.href)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
