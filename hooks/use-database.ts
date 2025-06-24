"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

// Hook personalizado para manejar datos de la base de datos
export function useDatabase() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const apiCall = async (url: string, options: RequestInit = {}) => {
    // Evitar múltiples llamadas simultáneas a la misma URL
    if (loading) {
      throw new Error("Operación en progreso")
    }

    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error en la operación")
      }

      return data.data
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado")
      }

      console.error("Error en API call:", error)
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Funciones para pedidos
  const getOrders = () => apiCall("/api/orders")

  const createOrder = (orderData: any) =>
    apiCall("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })

  const updateOrderStatus = (orderId: string, newStatus: string) =>
    apiCall(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ newStatus }),
    })

  const getOrderHistory = (orderId: string) => apiCall(`/api/orders/${orderId}/history`)

  const getAllHistory = () => apiCall("/api/history")

  // Funciones para KPIs
  const getKPIs = () => apiCall("/api/kpis")

  // Funciones para insumos
  const getSupplies = (orderId: string) => apiCall(`/api/supplies?orderId=${orderId}`)

  const consumeSupplies = (orderId: string, consumptions: any[]) =>
    apiCall("/api/supplies/consume", {
      method: "POST",
      body: JSON.stringify({ orderId, consumptions }),
    })

  const getSupplyHistory = (orderId: string) => apiCall(`/api/supplies/${orderId}/history`)

  return {
    loading,
    // Orders
    getOrders,
    createOrder,
    updateOrderStatus,
    getOrderHistory,
    getAllHistory,
    // KPIs
    getKPIs,
    // Supplies
    getSupplies,
    consumeSupplies,
    getSupplyHistory,
  }
}
