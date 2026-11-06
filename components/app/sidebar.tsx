"use client"

//* Libraries imports
import Link from "next/link"
import { usePathname } from "next/navigation"

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
  useSidebar,
} from "@/components/ui/sidebar"

//* Local imports
import { mainNavigation } from "@/components/app/main-navigation"
import { isActivePath } from "@/components/app/sidebar-active-path"

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              id="sidebar-brand"
              size="lg"
              render={<Link href="/dashboard" />}
              onClick={() => setOpenMobile(false)}
            >
              <span className="font-heading text-sm font-medium">
                Meawstory
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Navegação principal">
              <SidebarMenu>
                {mainNavigation.map((item) => {
                  const active = isActivePath(pathname, item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        id={`sidebar-${item.id}`}
                        isActive={active}
                        aria-current={active ? "page" : undefined}
                        render={<Link href={item.href} />}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
