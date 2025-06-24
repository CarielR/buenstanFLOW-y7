"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Settings, Factory, HelpCircle, User } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items
const items = [
  {
    title: "Panel",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Gestión",
    url: "/gestion",
    icon: Settings,
  },
  {
    title: "Producción",
    url: "/produccion",
    icon: Factory,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900 rounded-lg transition-all duration-300 hover:bg-gray-800 hover:shadow-lg">
          <h1 className="text-white font-bold text-lg tracking-wide">BUESTANFLOW</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link
                      href={item.url}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                        hover:bg-gray-100
                        ${
                          pathname === item.url
                            ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700 font-semibold"
                            : "hover:text-gray-900"
                        }
                      `}
                    >
                      <item.icon
                        className={`
                        h-5 w-5 transition-colors duration-200
                        ${pathname === item.url ? "text-blue-600" : "hover:text-blue-600"}
                      `}
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Ayuda</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="transition-colors duration-200 hover:bg-gray-100">
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-medium">Soporte</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="transition-colors duration-200 hover:bg-gray-100">
              <User className="h-5 w-5" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">J. Operario</span>
                <span className="truncate text-xs text-gray-500">Usuario</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
