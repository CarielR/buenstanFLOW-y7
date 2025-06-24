// Configuración de base de datos para Next.js
export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "buestanflow_production",
}

// Tipos de datos de la base de datos
export interface DBOrder {
  id: string
  cliente_id: number
  producto_id: number
  cantidad: number
  estado: "En cola" | "En proceso" | "Finalizado" | "Cancelado"
  prioridad: "Alta" | "Media" | "Baja"
  precio_total: number
  notas?: string
  fecha_entrega_estimada?: string
  fecha_entrega_real?: string
  usuario_asignado_id?: number
  fecha_creacion: string
  fecha_actualizacion: string
  cliente_nombre?: string
  cliente_email?: string
  producto_nombre?: string
  producto_categoria?: string
  usuario_asignado?: string
}

export interface DBClient {
  id: number
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  pais?: string
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface DBProduct {
  id: number
  nombre: string
  descripcion?: string
  categoria: "zapato" | "botin" | "sandalia" | "deportivo" | "formal"
  precio_base: number
  tiempo_produccion_horas: number
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface DBSupply {
  id: number
  nombre: string
  descripcion?: string
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  precio_unitario: number
  proveedor?: string
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface DBStatusChange {
  id: number
  pedido_id: string
  estado_anterior?: string
  estado_nuevo: string
  usuario_id: number
  notas?: string
  fecha_cambio: string
  usuario_nombre?: string
}

export interface DBSupplyConsumption {
  id: number
  pedido_id: string
  insumo_id: number
  cantidad_consumida: number
  usuario_id: number
  fecha_consumo: string
  notas?: string
  insumo_nombre?: string
  unidad_medida?: string
  usuario_nombre?: string
}

export interface DBKPI {
  pedidos_en_cola: number
  pedidos_en_proceso: number
  pedidos_finalizados_hoy: number
  unidades_en_proceso: number
  insumos_stock_bajo: number
}
