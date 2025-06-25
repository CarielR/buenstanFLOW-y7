import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = "24h"
const COOKIE_NAME = "auth-token"

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

export interface AuthToken {
  userId: number
  email: string
  rolId: number
  rolNombre: string
  iat: number
  exp: number
}

export interface Permission {
  id: number
  nombre: string
  descripcion: string
  modulo: string
  accion: string
}

// Generar hash de password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verificar password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generar JWT token
export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    rolId: user.rol_id,
    rolNombre: user.rol_nombre,
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Verificar JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken
  } catch (error) {
    console.error("Error verificando token:", error)
    return null
  }
}

// Obtener token de las cookies
export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value || null
  } catch (error) {
    console.error("Error obteniendo token de cookies:", error)
    return null
  }
}

// Obtener usuario actual desde token
export async function getCurrentUser(): Promise<AuthToken | null> {
  const token = await getTokenFromCookies()
  if (!token) return null

  return verifyToken(token)
}

// Verificar si el usuario tiene un permiso específico
export function hasPermission(userPermissions: Permission[], requiredPermission: string): boolean {
  return userPermissions.some((permission) => permission.nombre === requiredPermission)
}

// Verificar si el usuario tiene alguno de los permisos requeridos
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some((permission) => hasPermission(userPermissions, permission))
}

// Verificar si el usuario tiene todos los permisos requeridos
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every((permission) => hasPermission(userPermissions, permission))
}

// Generar token de reset de password
export function generateResetToken(): string {
  return jwt.sign({ type: "reset" }, JWT_SECRET, { expiresIn: "1h" })
}

// Verificar token de reset
export function verifyResetToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.type === "reset"
  } catch {
    return false
  }
}

// Limpiar tokens expirados (función para cron job)
export function cleanExpiredTokens() {
  // Esta función se implementaría para limpiar tokens expirados de la base de datos
  console.log("Limpiando tokens expirados...")
}
