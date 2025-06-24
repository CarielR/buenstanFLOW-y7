import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ProductionProvider } from "@/components/production-context"
import { SidebarProvider } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Producción - BUESTANFLOW",
  description: "Panel de control para gestión de pedidos y producción",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ProductionProvider>
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </ProductionProvider>
      </body>
    </html>
  )
}
