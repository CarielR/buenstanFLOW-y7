import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { user, permissions, error } = await authenticateRequest(request)

    if (error || !user) {
      return NextResponse.json({ success: false, error: error || "No autenticado" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.userId,
          nombre: user.email, // Temporal, debería venir de la DB
          email: user.email,
          rol_id: user.rolId,
          rol_nombre: user.rolNombre,
          activo: true,
          debe_cambiar_password: false,
        },
        permissions,
      },
    })
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
