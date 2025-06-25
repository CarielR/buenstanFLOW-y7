"use client"

import type React from "react"

import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requireAny?: boolean // Si true, requiere cualquiera de los permisos. Si false, requiere todos
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAny = false,
  fallback,
}: ProtectedRouteProps) {
  const { user, permissions, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  // Mostrar loading mientras se verifica la autenticación
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

  // Si no hay usuario, no mostrar nada (se redirigirá al login)
  if (!user) {
    return null
  }

  // Verificar permisos si se especificaron
  if (requiredPermissions.length > 0) {
    const hasPermission = requireAny
      ? requiredPermissions.some((permission) => permissions.some((p) => p.nombre === permission))
      : requiredPermissions.every((permission) => permissions.some((p) => p.nombre === permission))

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
                  <p className="text-xs text-gray-500 mt-1">Permisos requeridos: {requiredPermissions.join(", ")}</p>
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
