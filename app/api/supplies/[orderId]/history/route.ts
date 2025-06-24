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

// GET - Obtener historial de consumos de un pedido
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params
    const connection = await getConnection()

    const [rows] = await connection.execute(
      `
      SELECT 
        c.id,
        c.pedido_id as orderId,
        c.insumo_id as supplyId,
        c.cantidad_consumida as consumed,
        c.fecha_consumo as timestamp,
        c.notas,
        c.usuario_id,
        i.nombre as supply_name,
        i.unidad_medida,
        u.nombre as user
      FROM consumos_insumos c
      LEFT JOIN insumos i ON c.insumo_id = i.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.pedido_id = ?
      ORDER BY c.fecha_consumo DESC
    `,
      [orderId],
    )

    await connection.end()

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("Error obteniendo historial de consumos:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo historial de consumos" }, { status: 500 })
  }
}
