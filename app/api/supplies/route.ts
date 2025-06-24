import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/database"

// Crear conexión a la base de datos
async function getConnection() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      charset: "utf8mb4",
    })
    return connection
  } catch (error) {
    console.error("Error conectando a la base de datos:", error)
    throw new Error("Error de conexión a la base de datos")
  }
}

// Función para generar insumos automáticamente basados en el producto
async function generateSuppliesForOrder(connection: any, orderId: string, productName: string, quantity: number) {
  console.log(`Generando insumos para pedido ${orderId}, producto: ${productName}, cantidad: ${quantity}`)

  const baseSupplies = [
    { name: "Cuero Base", required: quantity * 0.08, unit: "m²", stock: 50 },
    { name: "Plantilla Estándar", required: quantity, unit: "u", stock: 300 },
    { name: "Suela Básica", required: quantity, unit: "u", stock: 200 },
  ]

  // Agregar insumos específicos según el tipo de producto
  if (productName.toLowerCase().includes("zapato")) {
    baseSupplies.push({ name: "Cordones", required: quantity * 2, unit: "u", stock: 400 })
  } else if (productName.toLowerCase().includes("botín")) {
    baseSupplies.push({ name: "Forro Interno", required: quantity, unit: "u", stock: 150 })
  } else if (productName.toLowerCase().includes("sandalia")) {
    baseSupplies.push({ name: "Correa Ajustable", required: quantity * 2, unit: "u", stock: 200 })
  }

  // Insertar insumos en la base de datos
  for (const supply of baseSupplies) {
    // Verificar si el insumo ya existe
    const [existingSupply] = (await connection.execute(
      "SELECT id FROM insumos WHERE nombre = ? AND unidad_medida = ?",
      [supply.name, supply.unit],
    )) as any

    let supplyId
    if (existingSupply.length === 0) {
      // Crear nuevo insumo
      const [insertResult] = (await connection.execute(
        "INSERT INTO insumos (nombre, unidad_medida, stock_actual) VALUES (?, ?, ?)",
        [supply.name, supply.unit, supply.stock],
      )) as any
      supplyId = insertResult.insertId
    } else {
      supplyId = existingSupply[0].id
    }

    // Verificar si ya existe la relación pedido-insumo
    const [existingRelation] = (await connection.execute(
      "SELECT id FROM pedido_insumos WHERE pedido_id = ? AND insumo_id = ?",
      [orderId, supplyId],
    )) as any

    if (existingRelation.length === 0) {
      // Crear relación pedido-insumo
      await connection.execute(
        "INSERT INTO pedido_insumos (pedido_id, insumo_id, cantidad_requerida) VALUES (?, ?, ?)",
        [orderId, supplyId, supply.required],
      )
    }
  }

  console.log(`Insumos generados exitosamente para pedido ${orderId}`)
}

// GET - Obtener insumos para un pedido específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId es requerido" }, { status: 400 })
    }

    const connection = await getConnection()

    // Verificar si el pedido existe
    const [orderCheck] = (await connection.execute("SELECT id, producto_id, cantidad FROM pedidos WHERE id = ?", [
      orderId,
    ])) as any

    if (orderCheck.length === 0) {
      await connection.end()
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 })
    }

    const order = orderCheck[0]

    // Verificar si el pedido tiene insumos configurados
    const [suppliesCheck] = (await connection.execute(
      "SELECT COUNT(*) as count FROM pedido_insumos WHERE pedido_id = ?",
      [orderId],
    )) as any

    // Si no tiene insumos, generarlos automáticamente
    if (suppliesCheck[0].count === 0) {
      console.log(`Pedido ${orderId} no tiene insumos configurados, generando automáticamente...`)

      // Obtener información del producto
      const [productInfo] = (await connection.execute("SELECT nombre FROM productos WHERE id = ?", [
        order.producto_id,
      ])) as any

      const productName = productInfo.length > 0 ? productInfo[0].nombre : "Producto Genérico"

      await generateSuppliesForOrder(connection, orderId, productName, order.cantidad)
    }

    // Obtener insumos del pedido
    const [rows] = await connection.execute(
      `
      SELECT 
        pi.id,
        pi.pedido_id,
        pi.insumo_id,
        pi.cantidad_requerida,
        i.nombre,
        i.unidad_medida,
        i.stock_actual,
        COALESCE(SUM(ci.cantidad_consumida), 0) as total_consumido
      FROM pedido_insumos pi
      JOIN insumos i ON pi.insumo_id = i.id
      LEFT JOIN consumo_insumos ci ON pi.pedido_id = ci.pedido_id AND pi.insumo_id = ci.insumo_id
      WHERE pi.pedido_id = ?
      GROUP BY pi.id, pi.pedido_id, pi.insumo_id, pi.cantidad_requerida, i.nombre, i.unidad_medida, i.stock_actual
      ORDER BY i.nombre
    `,
      [orderId],
    )

    await connection.end()

    const supplies = (rows as any[]).map((row) => ({
      id: row.insumo_id,
      name: row.nombre,
      required: Number.parseFloat(row.cantidad_requerida),
      available: Number.parseFloat(row.stock_actual),
      used: 0, // Siempre empezar en 0 para nuevos consumos
      unit: row.unidad_medida,
      originalAvailable: Number.parseFloat(row.stock_actual),
      totalConsumed: Number.parseFloat(row.total_consumido),
    }))

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
