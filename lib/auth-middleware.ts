import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "./database"
import { verifyToken, type AuthToken, type Permission } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthToken
  permissions?: Permission[]
}

// Crear conexión a la base de datos
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

// Obtener permisos del usuario
async function getUserPermissions(userId: number): Promise<Permission[]> {
  const connection = await getConnection()

  try {
    const [rows] = await connection.execute(
      `
      SELECT DISTINCT p.id, p.nombre, p.descripcion, p.modulo, p.accion
      FROM permisos p
      JOIN rol_permisos rp ON p.id = rp.permiso_id
      JOIN usuarios u ON rp.rol_id = u.rol_id
      WHERE u.id = ? AND p.activo = TRUE AND u.activo = TRUE
    `,
      [userId],
    )

    return rows as Permission[]
  } finally {
    await connection.end()
  }
}

// Registrar acción en auditoría
async function logAuditAction(
  userId: number | null,
  accion: string,
  modulo: string,
  descripcion: string,
  datosAnteriores: any = null,
  datosNuevos: any = null,
  ipAddress?: string,
  userAgent?: string,
) {
  const connection = await getConnection()

  try {
    await connection.execute(
      `
      INSERT INTO auditoria_acciones 
      (usuario_id, accion, modulo, descripcion, datos_anteriores, datos_nuevos, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        accion,
        modulo,
        descripcion,
        datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datosNuevos ? JSON.stringify(datosNuevos) : null,
        ipAddress,
        userAgent,
      ],
    )
  } catch (error) {
    console.error("Error registrando auditoría:", error)
  } finally {
    await connection.end()
  }
}

// Middleware de autenticación
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthToken | null
  permissions: Permission[]
  error?: string
}> {
  try {
    // Obtener token del header Authorization o cookies
    let token: string | null = null

    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get("auth-token")?.value || null
    }

    if (!token) {
      return { user: null, permissions: [], error: "Token no encontrado" }
    }

    // Verificar token
    const user = verifyToken(token)
    if (!user) {
      return { user: null, permissions: [], error: "Token inválido" }
    }

    // Verificar que el usuario siga activo
    const connection = await getConnection()
    try {
      const [userRows] = (await connection.execute("SELECT activo, bloqueado_hasta FROM usuarios WHERE id = ?", [
        user.userId,
      ])) as any

      if (userRows.length === 0) {
        return { user: null, permissions: [], error: "Usuario no encontrado" }
      }

      const userData = userRows[0]
      if (!userData.activo) {
        return { user: null, permissions: [], error: "Usuario inactivo" }
      }

      if (userData.bloqueado_hasta && new Date(userData.bloqueado_hasta) > new Date()) {
        return { user: null, permissions: [], error: "Usuario bloqueado temporalmente" }
      }

      // Actualizar último acceso
      await connection.execute("UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?", [user.userId])
    } finally {
      await connection.end()
    }

    // Obtener permisos del usuario
    const permissions = await getUserPermissions(user.userId)

    return { user, permissions }
  } catch (error) {
    console.error("Error en autenticación:", error)
    return { user: null, permissions: [], error: "Error interno de autenticación" }
  }
}

// Middleware para verificar permisos específicos
export function requirePermissions(requiredPermissions: string[]) {
  return async (request: NextRequest, user: AuthToken, permissions: Permission[]) => {
    const hasPermission = requiredPermissions.some((permission) => permissions.some((p) => p.nombre === permission))

    if (!hasPermission) {
      // Registrar intento de acceso no autorizado
      await logAuditAction(
        user.userId,
        "acceso_denegado",
        "seguridad",
        `Intento de acceso sin permisos: ${requiredPermissions.join(", ")}`,
        null,
        { url: request.url, method: request.method },
        request.ip,
        request.headers.get("user-agent") || undefined,
      )

      return NextResponse.json({ success: false, error: "Permisos insuficientes" }, { status: 403 })
    }

    return null // Sin error, continuar
  }
}

// Función para registrar auditoría (exportada para uso en APIs)
export { logAuditAction }
