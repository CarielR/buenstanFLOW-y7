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

// GET - Obtener insumos para un pedido específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId es requerido" }, { status: 400 })
    }

    console.log(`Obteniendo insumos para pedido: ${orderId}`)

    const connection = await getConnection()

    try {
      // Verificar si el pedido tiene insumos asignados
      const [existingSupplies] = (await connection.execute(
        "SELECT COUNT(*) as count FROM pedido_insumos WHERE pedido_id = ?",
        [orderId],
      )) as any

      console.log(`Insumos existentes para pedido ${orderId}: ${existingSupplies[0].count}`)

      // Si no tiene insumos, generarlos automáticamente
      if (existingSupplies[0].count === 0) {
        console.log(`Generando insumos automáticamente para pedido ${orderId}`)

        // Obtener información del pedido
        const [pedidoInfo] = (await connection.execute(
          `
          SELECT p.cantidad, pr.categoria, pr.nombre as producto_nombre
          FROM pedidos p
          JOIN productos pr ON p.producto_id = pr.id
          WHERE p.id = ?
        `,
          [orderId],
        )) as any

        if (pedidoInfo.length === 0) {
          await connection.end()
          return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
        }

        const { cantidad, categoria, producto_nombre } = pedidoInfo[0]
        console.log(`Pedido info: ${cantidad} unidades de ${producto_nombre} (${categoria})`)

        // Generar insumos base según la categoría
        const insumosBase = [
          { nombre: "Cuero Base", cantidad: cantidad * 0.08, unidad: "m²" },
          { nombre: "Plantilla Estándar", cantidad: cantidad, unidad: "u" },
          { nombre: "Suela Goma", cantidad: cantidad, unidad: "u" },
          { nombre: "Goma Vulca", cantidad: cantidad * 0.05, unidad: "kg" },
        ]

        // Agregar insumos específicos según categoría
        if (categoria === "zapato" || categoria === "formal") {
          insumosBase.push({ nombre: "Cordones Clásicos", cantidad: cantidad * 2, unidad: "u" })
        } else if (categoria === "botin") {
          insumosBase.push({ nombre: "Forro Interno", cantidad: cantidad, unidad: "u" })
        } else if (categoria === "sandalia") {
          insumosBase.push({ nombre: "Correa Ajustable", cantidad: cantidad * 2, unidad: "u" })
          insumosBase.push({ nombre: "Hebilla Metal", cantidad: cantidad, unidad: "u" })
        } else if (categoria === "deportivo") {
          insumosBase.push({ nombre: "Cordones Deportivos", cantidad: cantidad * 2, unidad: "u" })
        }

        // Insertar insumos en pedido_insumos
        for (const insumo of insumosBase) {
          // Buscar el insumo en la base de datos
          const [insumoData] = (await connection.execute("SELECT id FROM insumos WHERE nombre = ? LIMIT 1", [
            insumo.nombre,
          ])) as any

          if (insumoData.length > 0) {
            const insumoId = insumoData[0].id
            await connection.execute(
              "INSERT IGNORE INTO pedido_insumos (pedido_id, insumo_id, cantidad_requerida) VALUES (?, ?, ?)",
              [orderId, insumoId, insumo.cantidad],
            )
            console.log(`Insumo agregado: ${insumo.nombre} - ${insumo.cantidad} ${insumo.unidad}`)
          }
        }
      }

      // Obtener insumos con stock actual
      const [supplies] = (await connection.execute(
        `
        SELECT 
          pi.insumo_id as id,
          i.nombre as name,
          pi.cantidad_requerida as required,
          i.stock_actual as available,
          i.unidad_medida as unit,
          i.stock_actual as originalAvailable,
          COALESCE(SUM(ci.cantidad_consumida), 0) as used
        FROM pedido_insumos pi
        JOIN insumos i ON pi.insumo_id = i.id
        LEFT JOIN consumos_insumos ci ON pi.pedido_id = ci.pedido_id AND pi.insumo_id = ci.insumo_id
        WHERE pi.pedido_id = ?
        GROUP BY pi.insumo_id, i.nombre, pi.cantidad_requerida, i.stock_actual, i.unidad_medida
        ORDER BY i.nombre
      `,
        [orderId],
      )) as any

      console.log(`Insumos obtenidos para pedido ${orderId}:`, supplies.length)

      await connection.end()

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          supplies: supplies.map((supply: any) => ({
            id: supply.id,
            name: supply.name,
            required: Number.parseFloat(supply.required),
            available: Number.parseFloat(supply.available),
            used: 0, // Siempre empezar en 0 para nuevos consumos
            unit: supply.unit,
            originalAvailable: Number.parseFloat(supply.originalAvailable),
            totalUsed: Number.parseFloat(supply.used), // Total usado históricamente
          })),
        },
      })
    } catch (error) {
      await connection.end()
      throw error
    }
  } catch (error) {
    console.error("Error obteniendo insumos:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo insumos" }, { status: 500 })
  }
}
