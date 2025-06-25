// components/protected-route.tsx
"use client"

import React, { ReactNode, useEffect } from "react"
import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: string[]
  requireAny?: boolean // Si true, requiere cualquiera; si false, requiere todos
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAny = false,
  fallback,
}: ProtectedRouteProps) {
  const { user, permissions = [], loading, logout } = useAuth()
  const router = useRouter()

  // Si no hay usuario, redirige al login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando permisos...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredPermissions.length > 0) {
    // Aseguramos que `permissions` es siempre un array
    const perms: string[] = (permissions || []).map((p) => p.nombre)

    const hasPermission = requireAny
      ? requiredPermissions.some((req) => perms.includes(req))
      : requiredPermissions.every((req) => perms.includes(req))

    if (!hasPermission) {
      if (fallback) {
        return <>{fallback}</>
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Acceso Denegado</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    No tienes permisos suficientes para acceder a esta página.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Permisos requeridos: {requiredPermissions.join(", ")}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => router.back()}>
                    Volver
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Inicio
                  </Button>
                  <Button variant="destructive" onClick={logout}>
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}
