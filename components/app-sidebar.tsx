// components/app-sidebar.tsx
"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  Factory,
  HelpCircle,
  User as UserIcon,
} from "lucide-react"
import { useAuth } from "./auth-context"
import { Avatar, AvatarFallback } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
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
} from "./ui/sidebar"

const items = [
  { title: "Panel", url: "/", icon: LayoutDashboard },
  { title: "Gestión", url: "/gestion", icon: Settings },
  { title: "Producción", url: "/produccion", icon: Factory },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
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
                        ${
                          pathname === item.url
                            ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700 font-semibold"
                            : "hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-colors duration-200 ${
                          pathname === item.url ? "text-blue-600" : "text-gray-600"
                        }`}
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
                <SidebarMenuButton asChild>
                  <Link
                    href="/soporte"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Soporte</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 data-[state=open]:bg-gray-100"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback>{user?.nombre?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left text-sm">
                    <span className="block truncate font-semibold">{user?.nombre || "Usuario"}</span>
                    <span className="block truncate text-xs text-gray-500">{user?.rol_nombre || "Sin rol"}</span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-gray-600" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-[224px] rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="px-2 py-1 text-sm font-normal">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback>{user?.nombre?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left text-sm">
                      <span className="block truncate font-semibold">{user?.nombre || "Usuario"}</span>
                      <span className="block truncate text-xs text-gray-500">{user?.email || ""}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracion" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
