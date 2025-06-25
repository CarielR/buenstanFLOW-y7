

// C:\Users\Asus\Documents\GitHub\buenstanFLOW-y7\app\api\orders\route.ts
import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/database"
import { authenticateRequest, requirePermissions, logAuditAction } from "@/lib/auth-middleware"

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

// GET - Obtener todos los pedidos
export async function GET(request: NextRequest) {
  // Autenticar usuario
  const { user, permissions, error } = await authenticateRequest(request)

  if (error || !user) {
    return NextResponse.json({ success: false, error: error || "No autenticado" }, { status: 401 })
  }

  // Verificar permisos
  const permissionCheck = await requirePermissions(["pedidos.leer"])(request, user, permissions)
  if (permissionCheck) return permissionCheck

  try {
    const connection = await getConnection()

    const [rows] = await connection.execute(`
      SELECT 
        p.id,
        p.cliente_id,
        p.producto_id,
        p.cantidad,
        p.estado,
        p.prioridad,
        p.precio_total,
        p.notas,
        p.fecha_entrega_estimada,
        p.fecha_entrega_real,
        p.usuario_asignado_id,
        p.fecha_creacion,
        p.fecha_actualizacion,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        pr.nombre as producto_nombre,
        pr.categoria as producto_categoria,
        u.nombre as usuario_asignado,
        DATEDIFF(p.fecha_entrega_estimada, CURDATE()) as dias_para_entrega
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN productos pr ON p.producto_id = pr.id
      LEFT JOIN usuarios u ON p.usuario_asignado_id = u.id
      ORDER BY p.fecha_creacion DESC
    `)

    await connection.end()

    // Registrar auditoría
    await logAuditAction(
      user.userId,
      "consultar_pedidos",
      "pedidos",
      "Consulta de lista de pedidos",
      null,
      { total_pedidos: (rows as any[]).length },
      request.ip,
      request.headers.get("user-agent") || undefined,
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error("Error obteniendo pedidos:", error)
    return NextResponse.json({ success: false, error: "Error obteniendo pedidos" }, { status: 500 })
  }
}

// POST - Crear nuevo pedido
export async function POST(request: NextRequest) {
  // Autenticar usuario
  const { user, permissions, error } = await authenticateRequest(request)

  if (error || !user) {
    return NextResponse.json({ success: false, error: error || "No autenticado" }, { status: 401 })
  }

  // Verificar permisos
  const permissionCheck = await requirePermissions(["pedidos.crear"])(request, user, permissions)
  if (permissionCheck) return permissionCheck

  let connection
  try {
    const body = await request.json()
    const { product, quantity, priority, client, notes } = body

    console.log("Creando pedido:", { product, quantity, priority, client, notes })

    connection = await getConnection()

    // Iniciar transacción
    await connection.beginTransaction()

    // Generar nuevo ID
    const [maxIdResult] = (await connection.execute(
      'SELECT MAX(CAST(SUBSTRING(id, 2) AS UNSIGNED)) as max_id FROM pedidos WHERE id LIKE "P%"',
    )) as any

    const maxId = maxIdResult[0]?.max_id || 1000
    const newId = `P${maxId + 1}`

    console.log("Nuevo ID generado:", newId)

    // Buscar cliente por nombre (o crear uno nuevo si no existe)
    const [clientResult] = (await connection.execute("SELECT id FROM clientes WHERE nombre = ?", [client])) as any

    let clientId
    if (clientResult.length === 0) {
      console.log("Creando nuevo cliente:", client)
      const [insertResult] = (await connection.execute(
        "INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)",
        [client, `${client.toLowerCase().replace(/\s+/g, "")}@email.com`, "000-000-0000"],
      )) as any
      clientId = insertResult.insertId
    } else {
      clientId = clientResult[0].id
    }

    console.log("Cliente ID:", clientId)

    // Buscar producto por nombre (o crear uno nuevo si no existe)
    const [productResult] = (await connection.execute("SELECT id, precio_base FROM productos WHERE nombre = ?", [
      product,
    ])) as any

    let productId, precioBase
    if (productResult.length === 0) {
      console.log("Creando nuevo producto:", product)
      const categoria = product.toLowerCase().includes("zapato")
        ? "zapato"
        : product.toLowerCase().includes("botin")
          ? "botin"
          : product.toLowerCase().includes("sandalia")
            ? "sandalia"
            : "zapato"

      const [insertResult] = (await connection.execute(
        "INSERT INTO productos (nombre, categoria, precio_base, descripcion) VALUES (?, ?, ?, ?)",
        [product, categoria, 100000, `Producto ${product} creado automáticamente`],
      )) as any
      productId = insertResult.insertId
      precioBase = 100000
    } else {
      productId = productResult[0].id
      precioBase = productResult[0].precio_base
    }

    console.log("Producto ID:", productId)

    const precioTotal = precioBase * quantity
    const fechaEntrega = new Date()
    fechaEntrega.setDate(fechaEntrega.getDate() + 14) // 14 días por defecto

    // Insertar pedido
    await connection.execute(
      `
      INSERT INTO pedidos (
        id, cliente_id, producto_id, cantidad, estado, prioridad, 
        precio_total, notas, fecha_entrega_estimada
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        newId,
        clientId,
        productId,
        quantity,
        "En cola",
        priority,
        precioTotal,
        notes || "Pedido creado desde el sistema",
        fechaEntrega.toISOString().split("T")[0],
      ],
    )

    console.log("Pedido insertado:", newId)

    // Registrar en historial
    await connection.execute(
      `
      INSERT INTO historial_estados (pedido_id, estado_nuevo, usuario_id, notas)
      VALUES (?, ?, ?, ?)
    `,
      [newId, "En cola", 1, "Pedido creado desde el sistema"],
    )

    console.log("Historial registrado")

    // Confirmar transacción
    await connection.commit()
    await connection.end()

    console.log("Pedido creado exitosamente:", newId)

    return NextResponse.json({
      success: true,
      data: { id: newId, message: "Pedido creado exitosamente" },
    })
  } catch (error) {
    console.error("Error creando pedido:", error)

    // Rollback en caso de error
    if (connection) {
      try {
        await connection.rollback()
        await connection.end()
      } catch (rollbackError) {
        console.error("Error en rollback:", rollbackError)
      }
    }

    return NextResponse.json({ success: false, error: "Error creando pedido" }, { status: 500 })
  }
}
