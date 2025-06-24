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

// POST - Registrar consumo de insumos (solo para pedidos en proceso)
export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const { orderId, consumptions } = await request.json()

    if (!orderId || !consumptions || consumptions.length === 0) {
      return NextResponse.json({ success: false, error: "Datos de consumo inválidos" }, { status: 400 })
    }

    console.log(`Procesando consumos para pedido ${orderId}:`, consumptions)

    connection = await getConnection()

    // Verificar que el pedido esté en estado "En proceso"
    const [orderCheck] = (await connection.execute("SELECT estado FROM pedidos WHERE id = ?", [orderId])) as any

    if (orderCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const orderStatus = orderCheck[0].estado

    if (orderStatus !== "En proceso") {
      return NextResponse.json(
        {
          success: false,
          error: `No se pueden registrar consumos. El pedido está en estado: ${orderStatus}. Solo se permiten consumos en pedidos "En proceso".`,
        },
        { status: 400 },
      )
    }

    // Iniciar transacción
    await connection.beginTransaction()

    try {
      for (const consumption of consumptions) {
        const { supplyId, quantity } = consumption

        if (quantity <= 0) {
          console.log(`Saltando insumo ${supplyId} - cantidad: ${quantity}`)
          continue
        }

        console.log(`Procesando consumo: Insumo ${supplyId}, Cantidad ${quantity}`)

        // Verificar stock disponible
        const [stockCheck] = (await connection.execute("SELECT stock_actual, nombre FROM insumos WHERE id = ?", [
          supplyId,
        ])) as any

        if (stockCheck.length === 0) {
          throw new Error(`Insumo ${supplyId} no encontrado`)
        }

        const currentStock = Number.parseFloat(stockCheck[0].stock_actual)
        const supplyName = stockCheck[0].nombre

        if (currentStock < quantity) {
          throw new Error(`Stock insuficiente para ${supplyName}. Disponible: ${currentStock}, Requerido: ${quantity}`)
        }

        console.log(`Stock verificado para ${supplyName}: ${currentStock} >= ${quantity}`)

        // Registrar consumo en la tabla consumos_insumos
        const [insertResult] = await connection.execute(
          `
          INSERT INTO consumos_insumos (pedido_id, insumo_id, cantidad_consumida, usuario_id, notas)
          VALUES (?, ?, ?, ?, ?)
        `,
          [orderId, supplyId, quantity, 1, `Consumo registrado en producción - ${new Date().toISOString()}`],
        )

        console.log(`Consumo registrado exitosamente:`, insertResult)

        // Verificar que el stock se actualizó (el trigger debería hacerlo automáticamente)
        const [newStockCheck] = (await connection.execute("SELECT stock_actual FROM insumos WHERE id = ?", [
          supplyId,
        ])) as any

        const newStock = Number.parseFloat(newStockCheck[0].stock_actual)
        console.log(`Stock después del consumo para ${supplyName}: ${newStock}`)

        if (newStock === currentStock) {
          // Si el trigger no funcionó, actualizar manualmente
          console.log("Trigger no funcionó, actualizando stock manualmente...")
          await connection.execute("UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?", [
            quantity,
            supplyId,
          ])

          // Registrar movimiento manual
          await connection.execute(
            `
            INSERT INTO movimientos_inventario 
            (insumo_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id, pedido_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              supplyId,
              "salida",
              quantity,
              currentStock,
              currentStock - quantity,
              "Consumo en producción (manual)",
              1,
              orderId,
            ],
          )

          console.log(`Stock actualizado manualmente para ${supplyName}`)
        }
      }

      await connection.commit()
      console.log(`Todos los consumos procesados exitosamente para pedido ${orderId}`)

      return NextResponse.json({
        success: true,
        data: { message: "Consumos registrados exitosamente" },
      })
    } catch (error) {
      await connection.rollback()
      console.error("Error en transacción, haciendo rollback:", error)
      throw error
    }
  } catch (error) {
    console.error("Error registrando consumos:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error registrando consumos" },
      { status: 500 },
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
