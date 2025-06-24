import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/database"

async function getConnection() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: "utf8mb4",
  })
  return connection
}

// GET - Obtener todo el historial de cambios
export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        h.id,
        h.pedido_id as orderId,
        h.estado_anterior as previousStatus,
        h.estado_nuevo as status,
        h.usuario_id,
        h.notas as notes,
        h.fecha_cambio as timestamp,
        u.nombre as user
      FROM historial_estados h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      ORDER BY h.fecha_cambio DESC
      LIMIT 100
    `)

    await connection.end()

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("Error obteniendo historial completo:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo historial" }, { status: 500 })
  }
}
