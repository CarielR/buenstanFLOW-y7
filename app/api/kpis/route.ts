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

// GET - Obtener KPIs del dashboard
export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()

    // Pedidos en cola
    const [enColaResult] = (await connection.execute(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado = "En cola"',
    )) as any

    // Pedidos en proceso (suma de cantidades)
    const [enProcesoResult] = (await connection.execute(
      'SELECT COALESCE(SUM(cantidad), 0) as total FROM pedidos WHERE estado = "En proceso"',
    )) as any

    // Pedidos finalizados hoy
    const [finalizadosResult] = (await connection.execute(
      'SELECT COUNT(*) as count FROM pedidos WHERE estado = "Finalizado" AND DATE(fecha_actualizacion) = CURDATE()',
    )) as any

    // Insumos con stock bajo
    const [stockBajoResult] = (await connection.execute(
      "SELECT COUNT(*) as count FROM insumos WHERE stock_actual <= stock_minimo AND activo = 1",
    )) as any

    await connection.end()

    const kpis = {
      totalInQueue: enColaResult[0].count,
      inProcess: enProcesoResult[0].total,
      finishedToday: finalizadosResult[0].count,
      averageTime: 2.5, // Valor fijo por ahora
      lowStock: stockBajoResult[0].count,
    }

    return NextResponse.json({ success: true, data: kpis })
  } catch (error) {
    console.error("Error obteniendo KPIs:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo KPIs" }, { status: 500 })
  }
}
