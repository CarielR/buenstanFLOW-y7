import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import { logAuditAction } from "@/lib/auth-middleware"

async function getConnection() {
  return mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: "utf8mb4",
  })
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const user = await getCurrentUser()

    if (user) {
      connection = await getConnection()

      // Marcar sesiones como inactivas
      await connection.execute("UPDATE sesiones_activas SET activa = FALSE WHERE usuario_id = ?", [user.userId])

      // Registrar logout
      await logAuditAction(
        user.userId,
        "logout",
        "auth",
        "Usuario cerró sesión",
        null,
        null,
        request.ip,
        request.headers.get("user-agent") || undefined,
      )
    }

    // Crear respuesta y limpiar cookie
    const response = NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente",
    })

    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Error en logout:", error)
    return NextResponse.json({ success: false, error: "Error cerrando sesión" }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
