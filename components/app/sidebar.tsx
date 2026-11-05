"use client"

//* Libraries imports
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenIcon, FileTextIcon, HouseIcon } from "lucide-react"

//* Components imports
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

//* Local imports
import { isActivePath } from "@/components/app/sidebar-active-path"
import { authClient } from "@/lib/auth-client"

const navigation = [
  {
    id: "sidebar-dashboard",
    title: "Início",
    href: "/dashboard",
    icon: HouseIcon,
  },
  {
    id: "sidebar-themes",
    title: "Exercícios",
    href: "/dashboard/themes",
    icon: BookOpenIcon,
  },
  {
    id: "sidebar-texts",
    title: "Minhas cenas",
    href: "/dashboard/texts",
    icon: FileTextIcon,
  },
] as const

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
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    id={item.id}
                    isActive={isActivePath(pathname, item.href)}
                    render={<Link href={item.href} />}
                    onClick={() => setOpenMobile(false)}
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
      <SidebarFooter>
        <Button
          id="sidebar-sign-out"
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.assign("/sign-in")
                },
              },
            })
          }}
        >
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
