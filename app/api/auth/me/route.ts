// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import mysql, { RowDataPacket } from "mysql2/promise"
import { dbConfig } from "@/lib/database"

interface UserRow extends RowDataPacket {
  id: number
  nombre: string
  email: string
  rol_id: number
  activo: boolean
  debe_cambiar_password: boolean
}

interface PermRow extends RowDataPacket {
  id: number
  nombre: string
  descripcion: string
  modulo: string
  accion: string
}

export async function GET(request: NextRequest) {
  // 1) Sacar token de la cookie
  const token = request.cookies.get("auth-token")?.value
  if (!token) {
    console.log("🔒 /api/auth/me: no token")
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
  }

  // 2) Verificar JWT
  const payload = verifyToken(token)
  if (!payload) {
    console.log("🔒 /api/auth/me: token inválido")
    return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
  }

  const conn = await mysql.createConnection({ ...dbConfig, charset: "utf8mb4" })
  try {
    // 3) Obtener datos de usuario
    const [userRows] = await conn.execute<UserRow[]>(
      `SELECT id, nombre, email, rol_id, activo, debe_cambiar_password
       FROM usuarios WHERE id = ?`,
      [payload.userId]
    )
    if (!userRows.length) {
      console.log(`🔒 /api/auth/me: usuario ${payload.userId} no existe`)
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }
    const user = userRows[0]

    // 4) Obtener permisos del rol
    const [permRows] = await conn.execute<PermRow[]>(
      `SELECT p.id, p.nombre, p.descripcion, p.modulo, p.accion
       FROM permisos p
       JOIN rol_permisos rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ? AND p.activo = TRUE`,
      [user.rol_id]
    )

    // 5) DEBUG: mostramos en la consola del servidor lo que devolvemos
    console.log("/api/auth/me →", {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol_id: user.rol_id,
        activo: user.activo,
        debe_cambiar_password: user.debe_cambiar_password,
      },
      permissions: permRows,
    })

    // 6) Devolvemos todo
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol_id: user.rol_id,
          activo: user.activo,
          debe_cambiar_password: user.debe_cambiar_password,
        },
        permissions: permRows,
      },
    })
  } catch (err) {
    console.error("❌ Error en /api/auth/me:", err)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  } finally {
    await conn.end()
  }
}
