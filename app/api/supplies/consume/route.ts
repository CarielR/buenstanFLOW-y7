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

// POST - Registrar consumo de insumos
export async function POST(request: NextRequest) {
  try {
    const { orderId, consumptions } = await request.json()

    if (!orderId || !consumptions || consumptions.length === 0) {
      return NextResponse.json({ success: false, error: "Datos de consumo inválidos" }, { status: 400 })
    }

    const connection = await getConnection()

    // Iniciar transacción
    await connection.beginTransaction()

    try {
      for (const consumption of consumptions) {
        const { supplyId, quantity } = consumption

        if (quantity <= 0) continue

        // Verificar stock disponible
        const [stockCheck] = (await connection.execute("SELECT stock_actual FROM insumos WHERE id = ?", [
          supplyId,
        ])) as any

        if (stockCheck.length === 0 || stockCheck[0].stock_actual < quantity) {
          throw new Error(`Stock insuficiente para insumo ${supplyId}`)
        }

        // Registrar consumo
        await connection.execute(
          `
          INSERT INTO consumos_insumos (pedido_id, insumo_id, cantidad_consumida, usuario_id, notas)
          VALUES (?, ?, ?, ?, ?)
        `,
          [orderId, supplyId, quantity, 1, "Consumo registrado desde el sistema"],
        )

        // El trigger se encarga de actualizar el stock automáticamente
      }

      await connection.commit()
      await connection.end()

      return NextResponse.json({
        success: true,
        data: { message: "Consumos registrados exitosamente" },
      })
    } catch (error) {
      await connection.rollback()
      await connection.end()
      throw error
    }
  } catch (error) {
    console.error("Error registrando consumos:", error)
    return NextResponse.json({ success: false, error: "Error registrando consumos" }, { status: 500 })
  }
}
