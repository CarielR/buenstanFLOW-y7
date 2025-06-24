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

// GET - Obtener historial de un pedido específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const connection = await getConnection()

    const [rows] = await connection.execute(
      `
      SELECT 
        h.id,
        h.pedido_id,
        h.estado_anterior,
        h.estado_nuevo as status,
        h.usuario_id,
        h.notas as notes,
        h.fecha_cambio as timestamp,
        u.nombre as user
      FROM historial_estados h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.pedido_id = ?
      ORDER BY h.fecha_cambio DESC
    `,
      [id],
    )

    await connection.end()

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("Error obteniendo historial:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo historial" }, { status: 500 })
  }
}
