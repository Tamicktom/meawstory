import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  Sidebar,
  SidebarProvider,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

describe("sidebar rendering", () => {
  it.each(["sidebar", "floating", "inset"] as const)(
    "renders the %s desktop variant on either side",
    (variant) => {
      for (const side of ["left", "right"] as const) {
        const html = renderToStaticMarkup(
          <SidebarProvider defaultOpen={false}>
            <Sidebar variant={variant} side={side}>
              Navigation
            </Sidebar>
          </SidebarProvider>
        )
        expect(html).toContain(`data-variant="${variant}"`)
        expect(html).toContain(`data-side="${side}"`)
        expect(html).toContain('data-state="collapsed"')
        expect(html).toContain("Navigation")
      }
    }
  )

  it("renders a non-collapsible sidebar without a desktop gap", () => {
    const html = renderToStaticMarkup(
      <SidebarProvider>
        <Sidebar collapsible="none">Navigation</Sidebar>
      </SidebarProvider>
    )
    expect(html).toContain("Navigation")
    expect(html).not.toContain('data-slot="sidebar-gap"')
  })

  it("renders active menu buttons with and without tooltip props", () => {
    for (const tooltip of [
      undefined,
      "Help",
      { children: "Help", side: "left" as const },
    ]) {
      const html = renderToStaticMarkup(
        <SidebarProvider>
          <SidebarMenuButton isActive tooltip={tooltip}>
            Scenes
          </SidebarMenuButton>
        </SidebarProvider>
      )
      expect(html).toContain("Scenes")
      expect(html).toContain("data-active")
      expect(html).toContain('data-sidebar="menu-button"')
    }
  })
})
