// lib/auth-middleware.ts

import { type NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { dbConfig } from "./database";
import { verifyToken, type AuthToken, type Permission } from "./auth";

// Crear conexión a la base de datos
async function getConnection() {
  return mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: "utf8mb4",
  });
}

// Obtener permisos del usuario
async function getUserPermissions(userId: number): Promise<Permission[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `
      SELECT DISTINCT p.id, p.nombre, p.descripcion, p.modulo, p.accion
      FROM permisos p
      JOIN rol_permisos rp ON p.id = rp.permiso_id
      JOIN usuarios u ON rp.rol_id = u.rol_id
      WHERE u.id = ? AND p.activo = TRUE AND u.activo = TRUE
      `,
      [userId]
    );
    return rows as Permission[];
  } finally {
    await connection.end();
  }
}

/**
 * Registra una acción en la tabla auditoria_acciones.
 * Convierte `undefined` en `null` para no romper el driver mysql2.
 */
export async function logAuditAction(
  userId: number | null,
  accion: string,
  modulo: string,
  descripcion: string | undefined = undefined,
  datosAnteriores: unknown | null = null,
  datosNuevos: unknown | null = null,
  ipAddress?: string,
  userAgent?: string
) {
  const connection = await getConnection();
  try {
    const sql = `
      INSERT INTO auditoria_acciones
        (usuario_id, accion, modulo, descripcion,
         datos_anteriores, datos_nuevos, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId ?? null,
      accion,
      modulo,
      descripcion ?? null,
      datosAnteriores != null ? JSON.stringify(datosAnteriores) : null,
      datosNuevos     != null ? JSON.stringify(datosNuevos)     : null,
      ipAddress       ?? null,
      userAgent       ?? null,
    ];

    await connection.execute(sql, params);
  } catch (error) {
    console.error("Error registrando auditoría:", error);
  } finally {
    await connection.end();
  }
}

// Middleware de autenticación usando JWT
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthToken | null;
  permissions: Permission[];
  error?: string;
}> {
  try {
    // Extraer token de cabecera o cookie
    let token: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get("auth-token")?.value ?? null;
    }

    if (!token) {
      return { user: null, permissions: [], error: "Token no encontrado" };
    }

    // Verificar y decodificar token
    const user = verifyToken(token);
    if (!user) {
      return { user: null, permissions: [], error: "Token inválido" };
    }

    // Validar estado en base de datos
    const connection = await getConnection();
    try {
      const [rows] = (await connection.execute(
        "SELECT activo, bloqueado_hasta FROM usuarios WHERE id = ?",
        [user.userId]
      )) as any[];

      if (!rows.length) {
        return { user: null, permissions: [], error: "Usuario no encontrado" };
      }

      const { activo, bloqueado_hasta } = rows[0];
      if (!activo) {
        return { user: null, permissions: [], error: "Usuario inactivo" };
      }
      if (bloqueado_hasta && new Date(bloqueado_hasta) > new Date()) {
        return { user: null, permissions: [], error: "Usuario bloqueado temporalmente" };
      }

      // Actualizar último acceso
      await connection.execute(
        "UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?",
        [user.userId]
      );
    } finally {
      await connection.end();
    }

    // Obtener permisos
    const permissions = await getUserPermissions(user.userId);
    return { user, permissions };
  } catch (error) {
    console.error("Error en autenticación:", error);
    return { user: null, permissions: [], error: "Error interno de autenticación" };
  }
}

// Middleware para verificar permisos específicos
export function requirePermissions(requiredPermissions: string[]) {
  return async (
    request: NextRequest,
    user: AuthToken,
    permissions: Permission[]
  ) => {
    const hasPermission = requiredPermissions.some((perm) =>
      permissions.some((p) => p.nombre === perm)
    );

    if (!hasPermission) {
      // Registrar intento de acceso no autorizado
      await logAuditAction(
        user.userId,
        "acceso_denegado",
        "seguridad",
        undefined,                                   // descripción
        null,                                        // datosAnteriores
        { url: request.url, method: request.method },// datosNuevos
        request.ip ?? undefined,                     // ipAddress
        request.headers.get("user-agent") ?? undefined // userAgent
      );

      return NextResponse.json(
        { success: false, error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    return null; // Sin error, continúa el flujo
  };
}
