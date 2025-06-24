"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, Factory, Menu, X, HelpCircle } from "lucide-react"

const navigation = [
  { name: "Panel", href: "/", icon: LayoutDashboard },
  { name: "Gestión", href: "/gestion", icon: Settings },
  { name: "Producción", href: "/produccion", icon: Factory },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
            <h1 className="text-white font-bold text-lg">BUESTANFLOW</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive ? "bg-gray-700 text-white" : "text-gray-100 hover:bg-gray-700 hover:text-white",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Help button */}
          <div className="p-4">
            <Button variant="ghost" className="w-full justify-start text-gray-100 hover:bg-gray-700 hover:text-white">
              <HelpCircle className="mr-3 h-5 w-5" />
              Ayuda
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-gray-100 text-sm">
              <div>Usuario</div>
              <div className="text-xs text-gray-300">J. Operario</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
