"use client"

//* Libraries imports
import Link from "next/link"
import { usePathname } from "next/navigation"

//* Local imports
import { mainNavigation } from "@/components/app/main-navigation"
import { isActivePath } from "@/components/app/sidebar-active-path"

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal"
      data-app-navigation=""
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {mainNavigation.map((item) => {
          const active = isActivePath(pathname, item.href)

          return (
            <li key={item.href}>
              <Link
                id={`mobile-${item.id}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active ? "" : undefined}
                className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-xs leading-tight text-muted-foreground data-active:bg-accent data-active:font-medium data-active:text-foreground"
              >
                <item.icon aria-hidden="true" className="size-4" />
                <span>{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
