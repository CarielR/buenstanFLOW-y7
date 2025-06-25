"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDatabase } from "@/hooks/use-database"

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
  cliente_nombre?: string
  producto_nombre?: string
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
  supply_name?: string
  unidad_medida?: string
}

interface ProductionContextType {
  orders: Order[]
  statusHistory: StatusChange[]
  orderSupplies: OrderSupplies[]
  supplyConsumptions: SupplyConsumption[]
  loading: boolean
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>
  updateSupplyUsage: (orderId: string, supplyId: string, used: number) => void
  saveSupplyUsage: (orderId: string) => Promise<void>
  addNewOrder: (orderData: {
    product: string
    quantity: number
    priority: "Alta" | "Media" | "Baja"
    client: string
    notes?: string
  }) => Promise<void>
  getSupplyConsumptions: (orderId: string) => SupplyConsumption[]
  getOrderStatusHistory: (orderId: string) => StatusChange[]
  getAllStatusHistory: () => StatusChange[]
  getKPIs: () => {
    totalInQueue: number
    inProcess: number
    finishedToday: number
    averageTime: number
  }
  refreshData: () => Promise<void>
  loadSuppliesForOrder: (orderId: string) => Promise<void>
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined)

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const db = useDatabase()

  const [orders, setOrders] = useState<Order[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([])
  const [orderSupplies, setOrderSupplies] = useState<OrderSupplies[]>([])
  const [supplyConsumptions, setSupplyConsumptions] = useState<SupplyConsumption[]>([])
  const [loadedSupplies, setLoadedSupplies] = useState<Set<string>>(new Set()) // Track loaded supplies
  const [kpis, setKpis] = useState({
    totalInQueue: 0,
    inProcess: 0,
    finishedToday: 0,
    averageTime: 2.5,
  })

  // Cargar datos iniciales
  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = useCallback(async () => {
    try {
      console.log("Cargando datos del sistema...")

      // Cargar pedidos
      const ordersData = await db.getOrders()
      const transformedOrders = ordersData.map((order: any) => ({
        id: order.id,
        product: order.producto_nombre || order.product || "Producto",
        quantity: order.cantidad,
        status: order.estado,
        priority: order.prioridad,
        client: order.cliente_nombre || order.client || "Cliente",
        createdAt: new Date(order.fecha_creacion),
        updatedAt: new Date(order.fecha_actualizacion),
        cliente_nombre: order.cliente_nombre,
        producto_nombre: order.producto_nombre,
      }))
      setOrders(transformedOrders)
      console.log(`Cargados ${transformedOrders.length} pedidos`)

      // Cargar historial completo
      const historyData = await db.getAllHistory()
      const transformedHistory = historyData.map((item: any) => ({
        id: item.id.toString(),
        orderId: item.orderId,
        status: item.status,
        user: item.user || "Usuario",
        timestamp: new Date(item.timestamp),
        previousStatus: item.previousStatus,
        notes: item.notes,
      }))
      setStatusHistory(transformedHistory)

      // Cargar KPIs
      const kpisData = await db.getKPIs()
      setKpis({
        totalInQueue: kpisData.totalInQueue || 0,
        inProcess: kpisData.inProcess || 0,
        finishedToday: kpisData.finishedToday || 0,
        averageTime: kpisData.averageTime || 2.5,
      })
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudieron kpi",
        variant: "destructive",
      })
    }
  }, [db, toast])

  const loadSuppliesForOrder = useCallback(
    async (orderId: string) => {
      if (!orderId) {
        console.log("No se puede cargar insumos: orderId vacío")
        return
      }

      // Verificar si ya están cargados
      if (loadedSupplies.has(orderId)) {
        console.log(`Insumos para pedido ${orderId} ya están cargados`)
        return
      }

      try {
        console.log(`Cargando insumos para pedido ${orderId}...`)

        const suppliesData = await db.getSupplies(orderId)

        if (!suppliesData || !suppliesData.supplies) {
          console.log(`No se encontraron insumos para pedido ${orderId}`)
          return
        }

        const transformedSupplies: OrderSupplies = {
          orderId: suppliesData.orderId,
          supplies: suppliesData.supplies.map((supply: any) => ({
            id: supply.id.toString(),
            name: supply.name,
            required: Number.parseFloat(supply.required) || 0,
            available: Number.parseFloat(supply.available) || 0,
            used: Number.parseFloat(supply.used) || 0,
            unit: supply.unit || "u",
            originalAvailable: Number.parseFloat(supply.originalAvailable) || 0,
          })),
        }

        setOrderSupplies((prev) => {
          const filtered = prev.filter((os) => os.orderId !== orderId)
          return [...filtered, transformedSupplies]
        })

        // Marcar como cargado
        setLoadedSupplies((prev) => new Set([...prev, orderId]))

        // Cargar historial de consumos
        const consumptionsData = await db.getSupplyHistory(orderId)
        const transformedConsumptions = consumptionsData.map((item: any) => ({
          id: item.id.toString(),
          orderId: item.orderId,
          supplyId: item.supplyId.toString(),
          consumed: Number.parseFloat(item.consumed) || 0,
          timestamp: new Date(item.timestamp),
          user: item.user || "Usuario",
          supply_name: item.supply_name,
          unidad_medida: item.unidad_medida,
        }))

        setSupplyConsumptions((prev) => {
          const filtered = prev.filter((sc) => sc.orderId !== orderId)
          return [...filtered, ...transformedConsumptions]
        })

        console.log(`Insumos cargados exitosamente para pedido ${orderId}`)
      } catch (error) {
        console.error(`Error cargando insumos para pedido ${orderId}:`, error)
        toast({
          title: "Error cargando insumos",
          description: `No se pudieron cargar los insumos para el pedido ${orderId}`,
          variant: "destructive",
        })
      }
    },
    [db, loadedSupplies, toast],
  )

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await db.updateOrderStatus(orderId, newStatus)

      // Actualizar estado local
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o)))

      // Recargar datos para obtener el historial actualizado
      await refreshData()

      toast({
        title: "Estado actualizado",
        description: `Pedido ${orderId} cambió a ${newStatus}`,
      })
    } catch (error) {
      console.error("Error actualizando estado:", error)
    }
  }

  const addNewOrder = async (orderData: {
    product: string
    quantity: number
    priority: "Alta" | "Media" | "Baja"
    client: string
    notes?: string
  }) => {
    try {
      console.log("Creando nuevo pedido:", orderData)

      const result = await db.createOrder(orderData)

      // Limpiar cache de insumos cargados para forzar recarga
      setLoadedSupplies(new Set())

      await refreshData()

      toast({
        title: "Pedido creado",
        description: `Pedido ${result.id} creado exitosamente`,
      })
    } catch (error) {
      console.error("Error creando pedido:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      })
    }
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

  const saveSupplyUsage = async (orderId: string) => {
    try {
      const orderSupply = orderSupplies.find((os) => os.orderId === orderId)
      if (!orderSupply) return

      const consumptions = orderSupply.supplies
        .filter((s) => s.used > 0)
        .map((s) => ({
          supplyId: Number.parseInt(s.id),
          quantity: s.used,
        }))

      if (consumptions.length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se registraron consumos para guardar",
          variant: "destructive",
        })
        return
      }

      await db.consumeSupplies(orderId, consumptions)

      // Marcar como no cargado para forzar recarga
      setLoadedSupplies((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })

      // Recargar insumos para este pedido
      await loadSuppliesForOrder(orderId)

      toast({
        title: "Consumos guardados",
        description: `Se registraron los consumos para el pedido ${orderId}`,
      })
    } catch (error) {
      console.error("Error guardando consumos:", error)
    }
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

  const getKPIs = () => kpis

  return (
    <ProductionContext.Provider
      value={{
        orders,
        statusHistory,
        orderSupplies,
        supplyConsumptions,
        loading: db.loading,
        updateOrderStatus,
        updateSupplyUsage,
        saveSupplyUsage,
        addNewOrder,
        getSupplyConsumptions,
        getOrderStatusHistory,
        getAllStatusHistory,
        getKPIs,
        refreshData,
        loadSuppliesForOrder,
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
