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

// PUT - Actualizar estado del pedido
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { newStatus } = await request.json()

    const connection = await getConnection()

    // Obtener estado actual
    const [currentOrder] = (await connection.execute("SELECT estado FROM pedidos WHERE id = ?", [id])) as any

    if (currentOrder.length === 0) {
      await connection.end()
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const currentStatus = currentOrder[0].estado

    // Validar transiciones válidas
    const validTransitions: Record<string, string[]> = {
      "En cola": ["En proceso"],
      "En proceso": ["Finalizado"],
      Finalizado: [],
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      await connection.end()
      return NextResponse.json({ success: false, error: "Transición de estado no válida" }, { status: 400 })
    }

    // Actualizar estado del pedido
    await connection.execute("UPDATE pedidos SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?", [
      newStatus,
      id,
    ])

    // Registrar en historial
    await connection.execute(
      `
      INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo, usuario_id, notas)
      VALUES (?, ?, ?, ?, ?)
    `,
      [id, currentStatus, newStatus, 1, `Cambio de ${currentStatus} a ${newStatus}`],
    )

    await connection.end()

    return NextResponse.json({
      success: true,
      data: { message: `Pedido ${id} actualizado a ${newStatus}` },
    })
  } catch (error) {
    console.error("Error actualizando estado:", error)
    return NextResponse.json({ success: false, error: "Error actualizando estado del pedido" }, { status: 500 })
  }
}
