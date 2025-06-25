"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export interface User {
  id: number
  nombre: string
  email: string
  rol_id: number
  rol_nombre: string
  activo: boolean
  ultimo_acceso?: Date
  debe_cambiar_password: boolean
}

export interface Permission {
  id: number
  nombre: string
  descripcion: string
  modulo: string
  accion: string
}

interface AuthContextType {
  user: User | null
  permissions: Permission[]
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data.user)
          setPermissions(data.data.permissions)
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setPermissions(data.data.permissions)

        toast({
          title: "Bienvenido",
          description: `Hola ${data.data.user.nombre}`,
        })

        // Redirigir según el rol
        if (data.data.user.debe_cambiar_password) {
          router.push("/auth/change-password")
        } else {
          router.push("/")
        }

        return true
      } else {
        toast({
          title: "Error de autenticación",
          description: data.error || "Credenciales inválidas",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Error en login:", error)
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Error en logout:", error)
    } finally {
      setUser(null)
      setPermissions([])
      router.push("/auth/login")

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
    }
  }

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return permissions.some((p) => p.nombre === permission)
    },
    [permissions],
  )

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.some((permission) => hasPermission(permission))
    },
    [hasPermission],
  )

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.every((permission) => hasPermission(permission))
    },
    [hasPermission],
  )

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
