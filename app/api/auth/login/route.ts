import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/database"
import { verifyPassword, generateToken } from "@/lib/auth"
import { logAuditAction } from "@/lib/auth-middleware"

async function getConnection() {
  return mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: "utf8mb4",
  })
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    connection = await getConnection()

    // Buscar usuario con su rol
    const [userRows] = (await connection.execute(
      `
      SELECT 
        u.id, u.nombre, u.email, u.password_hash, u.rol_id, u.activo,
        u.intentos_fallidos, u.bloqueado_hasta, u.debe_cambiar_password,
        r.nombre as rol_nombre
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
    `,
      [email],
    )) as any

    if (userRows.length === 0) {
      // Registrar intento de login fallido
      await logAuditAction(
        null,
        "login_fallido",
        "auth",
        `Intento de login con email inexistente: ${email}`,
        null,
        { email },
        request.ip,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 })
    }

    const user = userRows[0]

    // Verificar si el usuario está activo
    if (!user.activo) {
      await logAuditAction(
        user.id,
        "login_usuario_inactivo",
        "auth",
        `Intento de login con usuario inactivo: ${email}`,
        null,
        { email },
        request.ip,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ success: false, error: "Usuario inactivo" }, { status: 401 })
    }

    // Verificar si el usuario está bloqueado
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      await logAuditAction(
        user.id,
        "login_usuario_bloqueado",
        "auth",
        `Intento de login con usuario bloqueado: ${email}`,
        null,
        { email, bloqueado_hasta: user.bloqueado_hasta },
        request.ip,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ success: false, error: "Usuario bloqueado temporalmente" }, { status: 401 })
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      // Incrementar intentos fallidos
      const nuevosIntentos = user.intentos_fallidos + 1
      let bloqueadoHasta = null

      // Bloquear después de 5 intentos fallidos por 30 minutos
      if (nuevosIntentos >= 5) {
        bloqueadoHasta = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      }

      await connection.execute("UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?", [
        nuevosIntentos,
        bloqueadoHasta,
        user.id,
      ])

      await logAuditAction(
        user.id,
        "login_password_incorrecto",
        "auth",
        `Password incorrecto para usuario: ${email}. Intentos: ${nuevosIntentos}`,
        null,
        { email, intentos: nuevosIntentos, bloqueado: !!bloqueadoHasta },
        request.ip,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 })
    }

    // Login exitoso - resetear intentos fallidos
    await connection.execute(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    )

    // Obtener permisos del usuario
    const [permissionRows] = (await connection.execute(
      `
      SELECT DISTINCT p.id, p.nombre, p.descripcion, p.modulo, p.accion
      FROM permisos p
      JOIN rol_permisos rp ON p.id = rp.permiso_id
      WHERE rp.rol_id = ? AND p.activo = TRUE
    `,
      [user.rol_id],
    )) as any

    // Generar token JWT
    const userData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      activo: user.activo,
      debe_cambiar_password: user.debe_cambiar_password,
    }

    const token = generateToken(userData)

    // Guardar sesión activa
    await connection.execute(
      `
      INSERT INTO sesiones_activas (usuario_id, token_hash, ip_address, user_agent, fecha_expiracion)
      VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
    `,
      [
        user.id,
        Buffer.from(token).toString("base64").substring(0, 255),
        request.ip || "unknown",
        request.headers.get("user-agent")?.substring(0, 500) || "unknown",
      ],
    )

    // Registrar login exitoso
    await logAuditAction(
      user.id,
      "login_exitoso",
      "auth",
      `Login exitoso para usuario: ${email}`,
      null,
      { email, rol: user.rol_nombre },
      request.ip,
      request.headers.get("user-agent") || undefined,
    )

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        permissions: permissionRows,
      },
    })

    // Establecer cookie segura
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
