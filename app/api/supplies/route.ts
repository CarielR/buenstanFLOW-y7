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

// GET - Obtener insumos por pedido
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "ID de pedido requerido" }, { status: 400 })
    }

    const connection = await getConnection()

    // Obtener información del pedido
    const [orderInfo] = (await connection.execute(
      `
      SELECT p.producto_id, p.cantidad as order_quantity
      FROM pedidos p
      WHERE p.id = ?
    `,
      [orderId],
    )) as any

    if (orderInfo.length === 0) {
      await connection.end()
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const { producto_id, order_quantity } = orderInfo[0]

    // Obtener insumos necesarios para el producto
    const [supplies] = await connection.execute(
      `
      SELECT 
        i.id,
        i.nombre as name,
        i.unidad_medida as unit,
        i.stock_actual as available,
        (rp.cantidad_necesaria * ?) as required,
        0 as used,
        i.stock_actual as originalAvailable
      FROM recetas_productos rp
      JOIN insumos i ON rp.insumo_id = i.id
      WHERE rp.producto_id = ? AND i.activo = 1
      ORDER BY i.nombre
    `,
      [order_quantity, producto_id],
    )

    await connection.end()

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        supplies,
      },
    })
  } catch (error) {
    console.error("Error obteniendo insumos:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo insumos" }, { status: 500 })
  }
}
