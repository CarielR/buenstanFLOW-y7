"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export type OrderStatus = "En cola" | "En proceso" | "Finalizado"

export interface Order {
  id: string
  product: string
  quantity: number
  status: OrderStatus
  priority: "Alta" | "Media" | "Baja"
  client: string
  createdAt: Date
  updatedAt: Date
}

export interface StatusChange {
  id: string
  orderId: string
  status: OrderStatus
  user: string
  timestamp: Date
  previousStatus?: OrderStatus
  notes?: string
}

export interface Supply {
  id: string
  name: string
  required: number
  available: number
  used: number
  unit: string
  originalAvailable: number
}

export interface OrderSupplies {
  orderId: string
  supplies: Supply[]
}

export interface SupplyConsumption {
  id: string
  orderId: string
  supplyId: string
  consumed: number
  timestamp: Date
  user: string
}

interface ProductionContextType {
  orders: Order[]
  statusHistory: StatusChange[]
  orderSupplies: OrderSupplies[]
  supplyConsumptions: SupplyConsumption[]
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
  updateSupplyUsage: (orderId: string, supplyId: string, used: number) => void
  saveSupplyUsage: (orderId: string) => void
  addNewOrder: (orderData: {
    product: string
    quantity: number
    priority: "Alta" | "Media" | "Baja"
    client: string
    notes?: string
  }) => void
  getSupplyConsumptions: (orderId: string) => SupplyConsumption[]
  getOrderStatusHistory: (orderId: string) => StatusChange[]
  getAllStatusHistory: () => StatusChange[]
  getKPIs: () => {
    totalInQueue: number
    inProcess: number
    finishedToday: number
    averageTime: number
  }
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined)

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([
    {
      id: "P1023",
      product: "Zapato A",
      quantity: 50,
      status: "En cola",
      priority: "Alta",
      client: "Cliente ABC",
      createdAt: new Date("2025-06-22T08:00:00"),
      updatedAt: new Date("2025-06-22T08:00:00"),
    },
    {
      id: "P1024",
      product: "Botín B",
      quantity: 30,
      status: "En proceso",
      priority: "Media",
      client: "Cliente XYZ",
      createdAt: new Date("2025-06-21T10:00:00"),
      updatedAt: new Date("2025-06-22T14:30:00"),
    },
    {
      id: "P1025",
      product: "Sandalia C",
      quantity: 25,
      status: "Finalizado",
      priority: "Baja",
      client: "Cliente DEF",
      createdAt: new Date("2025-06-22T06:00:00"),
      updatedAt: new Date("2025-06-22T16:00:00"),
    },
    {
      id: "P1026",
      product: "Zapato D",
      quantity: 40,
      status: "En cola",
      priority: "Media",
      client: "Cliente GHI",
      createdAt: new Date("2025-06-22T09:00:00"),
      updatedAt: new Date("2025-06-22T09:00:00"),
    },
    {
      id: "P1027",
      product: "Botín E",
      quantity: 35,
      status: "En proceso",
      priority: "Alta",
      client: "Cliente JKL",
      createdAt: new Date("2025-06-21T15:00:00"),
      updatedAt: new Date("2025-06-22T13:00:00"),
    },
  ])

  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([
    // P1023 - Zapato A
    {
      id: "1",
      orderId: "P1023",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-22T08:00:00"),
      notes: "Pedido creado",
    },
    // P1024 - Botín B
    {
      id: "2",
      orderId: "P1024",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-21T10:00:00"),
      notes: "Pedido creado",
    },
    {
      id: "3",
      orderId: "P1024",
      status: "En proceso",
      previousStatus: "En cola",
      user: "J. Operario",
      timestamp: new Date("2025-06-22T14:30:00"),
      notes: "Iniciado por operario",
    },
    // P1025 - Sandalia C
    {
      id: "4",
      orderId: "P1025",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-22T06:00:00"),
      notes: "Pedido creado",
    },
    {
      id: "5",
      orderId: "P1025",
      status: "En proceso",
      previousStatus: "En cola",
      user: "M. Supervisor",
      timestamp: new Date("2025-06-22T10:15:00"),
      notes: "Prioridad alta - iniciado por supervisor",
    },
    {
      id: "6",
      orderId: "P1025",
      status: "Finalizado",
      previousStatus: "En proceso",
      user: "J. Operario",
      timestamp: new Date("2025-06-22T16:00:00"),
      notes: "Completado exitosamente",
    },
    // P1026 - Zapato D
    {
      id: "7",
      orderId: "P1026",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-22T09:00:00"),
      notes: "Pedido creado",
    },
    // P1027 - Botín E
    {
      id: "8",
      orderId: "P1027",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-21T15:00:00"),
      notes: "Pedido creado",
    },
    {
      id: "9",
      orderId: "P1027",
      status: "En proceso",
      previousStatus: "En cola",
      user: "L. Técnico",
      timestamp: new Date("2025-06-22T13:00:00"),
      notes: "Iniciado por técnico especializado",
    },
    // Cambios adicionales históricos
    {
      id: "10",
      orderId: "P1022",
      status: "En cola",
      user: "Sistema",
      timestamp: new Date("2025-06-21T08:00:00"),
      notes: "Pedido creado (histórico)",
    },
    {
      id: "11",
      orderId: "P1022",
      status: "En proceso",
      previousStatus: "En cola",
      user: "J. Operario",
      timestamp: new Date("2025-06-21T11:30:00"),
      notes: "Iniciado",
    },
    {
      id: "12",
      orderId: "P1022",
      status: "Finalizado",
      previousStatus: "En proceso",
      user: "J. Operario",
      timestamp: new Date("2025-06-21T18:45:00"),
      notes: "Completado - pedido histórico",
    },
  ])

  // Agregar datos de insumos para TODOS los pedidos
  const [orderSupplies, setOrderSupplies] = useState<OrderSupplies[]>([
    {
      orderId: "P1023",
      supplies: [
        { id: "1", name: "Goma Vulca", required: 2, available: 15, used: 0, unit: "kg", originalAvailable: 15 },
        { id: "2", name: "Plantilla", required: 50, available: 200, used: 0, unit: "u", originalAvailable: 200 },
        { id: "3", name: "Cinta de Tela", required: 8, available: 12, used: 0, unit: "m", originalAvailable: 12 },
      ],
    },
    {
      orderId: "P1024",
      supplies: [
        { id: "4", name: "Cuero Premium", required: 3, available: 10, used: 2.5, unit: "m²", originalAvailable: 10 },
        { id: "5", name: "Suela Goma", required: 30, available: 80, used: 25, unit: "u", originalAvailable: 80 },
        { id: "6", name: "Cordones", required: 60, available: 150, used: 30, unit: "u", originalAvailable: 150 },
      ],
    },
    // Agregar datos para P1025
    {
      orderId: "P1025",
      supplies: [
        { id: "7", name: "Suela Flexible", required: 25, available: 50, used: 0, unit: "u", originalAvailable: 50 },
        { id: "8", name: "Correa Ajustable", required: 50, available: 100, used: 0, unit: "u", originalAvailable: 100 },
        { id: "9", name: "Hebilla Metal", required: 25, available: 75, used: 0, unit: "u", originalAvailable: 75 },
      ],
    },
    // Agregar datos para P1026
    {
      orderId: "P1026",
      supplies: [
        { id: "10", name: "Cuero Sintético", required: 4, available: 20, used: 0, unit: "m²", originalAvailable: 20 },
        {
          id: "11",
          name: "Plantilla Comfort",
          required: 40,
          available: 120,
          used: 0,
          unit: "u",
          originalAvailable: 120,
        },
        {
          id: "12",
          name: "Cordones Deportivos",
          required: 80,
          available: 200,
          used: 0,
          unit: "u",
          originalAvailable: 200,
        },
      ],
    },
    // Agregar datos para P1027
    {
      orderId: "P1027",
      supplies: [
        {
          id: "13",
          name: "Cuero Premium Plus",
          required: 3.5,
          available: 8,
          used: 1.2,
          unit: "m²",
          originalAvailable: 8,
        },
        {
          id: "14",
          name: "Suela Antideslizante",
          required: 35,
          available: 90,
          used: 15,
          unit: "u",
          originalAvailable: 90,
        },
        { id: "15", name: "Forro Térmico", required: 70, available: 180, used: 35, unit: "u", originalAvailable: 180 },
      ],
    },
  ])

  const [supplyConsumptions, setSupplyConsumptions] = useState<SupplyConsumption[]>([])

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    // Validar transiciones válidas
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      "En cola": ["En proceso"],
      "En proceso": ["Finalizado"],
      Finalizado: [],
    }

    if (!validTransitions[order.status].includes(newStatus)) {
      toast({
        title: "Error",
        description: "Transición de estado no válida",
        variant: "destructive",
      })
      return
    }

    const previousStatus = order.status

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o)))

    setStatusHistory((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        orderId,
        status: newStatus,
        previousStatus,
        user: "J. Operario",
        timestamp: new Date(),
        notes: `Cambio de ${previousStatus} a ${newStatus}`,
      },
    ])

    toast({
      title: "Estado actualizado",
      description: `Pedido ${orderId} cambió a ${newStatus}`,
    })
  }

  const addNewOrder = (orderData: {
    product: string
    quantity: number
    priority: "Alta" | "Media" | "Baja"
    client: string
    notes?: string
  }) => {
    // Generar nuevo ID
    const maxId = Math.max(...orders.map((o) => Number.parseInt(o.id.replace("P", ""))), 1000)
    const newId = `P${maxId + 1}`

    const newOrder: Order = {
      id: newId,
      product: orderData.product,
      quantity: orderData.quantity,
      status: "En cola",
      priority: orderData.priority,
      client: orderData.client,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Agregar el pedido
    setOrders((prev) => [...prev, newOrder])

    // Agregar al historial
    setStatusHistory((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        orderId: newId,
        status: "En cola",
        user: "Sistema",
        timestamp: new Date(),
        notes: orderData.notes ? `Pedido creado - ${orderData.notes}` : "Pedido creado",
      },
    ])

    // Generar insumos automáticamente basados en el tipo de producto
    const generateSupplies = (product: string, quantity: number): Supply[] => {
      const baseSupplies = [
        { name: "Cuero Base", required: quantity * 0.08, available: 50, unit: "m²" },
        { name: "Plantilla Estándar", required: quantity, available: 300, unit: "u" },
        { name: "Suela Básica", required: quantity, available: 200, unit: "u" },
      ]

      if (product.toLowerCase().includes("zapato")) {
        baseSupplies.push({ name: "Cordones", required: quantity * 2, available: 400, unit: "u" })
      } else if (product.toLowerCase().includes("botín")) {
        baseSupplies.push({ name: "Forro Interno", required: quantity, available: 150, unit: "u" })
      } else if (product.toLowerCase().includes("sandalia")) {
        baseSupplies.push({ name: "Correa Ajustable", required: quantity * 2, available: 200, unit: "u" })
      }

      return baseSupplies.map((supply, index) => ({
        id: `${Date.now()}_${index}`,
        name: supply.name,
        required: supply.required,
        available: supply.available,
        used: 0,
        unit: supply.unit,
        originalAvailable: supply.available,
      }))
    }

    // Agregar insumos para el nuevo pedido
    const newSupplies: OrderSupplies = {
      orderId: newId,
      supplies: generateSupplies(orderData.product, orderData.quantity),
    }

    setOrderSupplies((prev) => [...prev, newSupplies])

    toast({
      title: "Pedido creado",
      description: `Pedido ${newId} creado exitosamente`,
    })
  }

  const updateSupplyUsage = (orderId: string, supplyId: string, used: number) => {
    setOrderSupplies((prev) =>
      prev.map((os) =>
        os.orderId === orderId
          ? {
              ...os,
              supplies: os.supplies.map((s) => (s.id === supplyId ? { ...s, used } : s)),
            }
          : os,
      ),
    )
  }

  const saveSupplyUsage = (orderId: string) => {
    const orderSupply = orderSupplies.find((os) => os.orderId === orderId)
    if (!orderSupply) return

    const hasExcess = orderSupply.supplies.some((s) => s.used > s.available)
    if (hasExcess) {
      toast({
        title: "Error de stock",
        description: "No se puede usar más cantidad de la disponible",
        variant: "destructive",
      })
      return
    }

    const hasUsage = orderSupply.supplies.some((s) => s.used > 0)
    if (!hasUsage) {
      toast({
        title: "Sin cambios",
        description: "No se registraron consumos para guardar",
        variant: "destructive",
      })
      return
    }

    setOrderSupplies((prev) =>
      prev.map((os) =>
        os.orderId === orderId
          ? {
              ...os,
              supplies: os.supplies.map((s) => ({
                ...s,
                available: s.available - s.used,
                used: 0,
              })),
            }
          : os,
      ),
    )

    const newConsumptions = orderSupply.supplies
      .filter((s) => s.used > 0)
      .map((s) => ({
        id: Date.now().toString() + s.id,
        orderId,
        supplyId: s.id,
        consumed: s.used,
        timestamp: new Date(),
        user: "J. Operario",
      }))

    setSupplyConsumptions((prev) => [...prev, ...newConsumptions])

    toast({
      title: "Consumos guardados",
      description: `Se registraron los consumos para el pedido ${orderId} y se actualizó el inventario`,
    })
  }

  const getSupplyConsumptions = (orderId: string) => {
    return supplyConsumptions.filter((sc) => sc.orderId === orderId)
  }

  const getOrderStatusHistory = (orderId: string) => {
    return statusHistory
      .filter((h) => h.orderId === orderId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getAllStatusHistory = () => {
    return statusHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getKPIs = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      totalInQueue: orders.filter((o) => o.status === "En cola").length,
      inProcess: orders.filter((o) => o.status === "En proceso").reduce((acc, o) => acc + o.quantity, 0),
      finishedToday: orders.filter((o) => o.status === "Finalizado" && o.updatedAt >= today).length,
      averageTime: 2.5,
    }
  }

  return (
    <ProductionContext.Provider
      value={{
        orders,
        statusHistory,
        orderSupplies,
        supplyConsumptions,
        updateOrderStatus,
        updateSupplyUsage,
        saveSupplyUsage,
        addNewOrder,
        getSupplyConsumptions,
        getOrderStatusHistory,
        getAllStatusHistory,
        getKPIs,
      }}
    >
      {children}
    </ProductionContext.Provider>
  )
}

export function useProduction() {
  const context = useContext(ProductionContext)
  if (context === undefined) {
    throw new Error("useProduction must be used within a ProductionProvider")
  }
  return context
}
