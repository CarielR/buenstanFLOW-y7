"use client"

import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useProduction } from "@/components/production-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronLeft, ChevronRight, History, Loader2, Lock, AlertTriangle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function ProduccionPage() {
  const {
    orders,
    orderSupplies,
    updateSupplyUsage,
    saveSupplyUsage,
    getSupplyConsumptions,
    loadSuppliesForOrder,
    loading,
  } = useProduction()

  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const [loadingSupplies, setLoadingSupplies] = useState(false)

  const handleOrderChange = useCallback((newOrderId: string) => {
    setSelectedOrderId(newOrderId)
  }, [])

  // Establecer el primer pedido como seleccionado cuando se cargan los datos
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id)
    }
  }, [orders.length, selectedOrderId])

  // Cargar insumos cuando cambia el pedido seleccionado - solo si está en proceso
  useEffect(() => {
    if (!selectedOrderId) return

    const selectedOrder = orders.find((o) => o.id === selectedOrderId)
    if (!selectedOrder) return

    // Solo cargar insumos si el pedido está en proceso
    if (selectedOrder.status === "En proceso") {
      const existingSupplies = orderSupplies.find((os) => os.orderId === selectedOrderId)
      if (!existingSupplies) {
        setLoadingSupplies(true)
        const timeoutId = setTimeout(() => {
          loadSuppliesForOrder(selectedOrderId).finally(() => {
            setLoadingSupplies(false)
          })
        }, 100)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [selectedOrderId, orders, orderSupplies, loadSuppliesForOrder])

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)
  const selectedSupplies = orderSupplies.find((os) => os.orderId === selectedOrderId)
  const consumptionHistory = getSupplyConsumptions(selectedOrderId)

  const getOrderIndex = () => {
    return orders.findIndex((o) => o.id === selectedOrderId)
  }

  const navigateOrder = (direction: "prev" | "next") => {
    const currentIndex = getOrderIndex()
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : orders.length - 1
    } else {
      newIndex = currentIndex < orders.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedOrderId(orders[newIndex].id)
  }

  const handleUsageChange = (supplyId: string, value: string) => {
    // Solo permitir cambios si el pedido está en proceso
    if (selectedOrder?.status !== "En proceso") return

    const numValue = Number.parseFloat(value) || 0
    updateSupplyUsage(selectedOrderId, supplyId, numValue)
  }

  const handleSave = async () => {
    if (selectedOrder?.status !== "En proceso") return
    await saveSupplyUsage(selectedOrderId)
  }

  const getTotalUsed = () => {
    if (!selectedSupplies) return 0
    return selectedSupplies.supplies.reduce((total, supply) => total + supply.used, 0)
  }

  const hasValidationErrors = () => {
    if (!selectedSupplies) return false
    return selectedSupplies.supplies.some((s) => s.used > s.available)
  }

  const canEditSupplies = selectedOrder?.status === "En proceso"

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (!selectedOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">No hay pedidos disponibles</p>
          <p className="text-sm text-gray-500">Verifica la conexión a la base de datos</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermissions={["produccion.leer", "produccion.consumir_insumos"]}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Sistema de Producción</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Insumos Utilizados</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Insumos Utilizados por Pedido</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pedido: #{selectedOrder.id}</span>
              <Button variant="outline" size="icon" onClick={() => navigateOrder("prev")} disabled={loading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateOrder("next")} disabled={loading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Order Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Selector de Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOrderId} onValueChange={handleOrderChange} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.id} - {order.product} - {order.quantity} pares - {order.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Order Context */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div>
                  <span className="text-sm text-gray-600">Pedido:</span>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Producto:</span>
                  <p className="font-medium">{selectedOrder.product}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cantidad:</span>
                  <p className="font-medium">{selectedOrder.quantity} pares</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Estado:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {selectedOrder.status === "Finalizado" && <Lock className="h-3 w-3" />}
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del pedido - Mostrar mensaje según el estado */}
          {selectedOrder.status !== "En proceso" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  {selectedOrder.status === "En cola" && (
                    <div className="space-y-2">
                      <div className="text-yellow-600 font-medium">Pedido en Cola</div>
                      <p className="text-sm text-gray-600">
                        Este pedido está esperando para iniciar producción. Los insumos se podrán gestionar cuando esté
                        en proceso.
                      </p>
                    </div>
                  )}
                  {selectedOrder.status === "Finalizado" && (
                    <div className="space-y-2">
                      <div className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        Pedido Finalizado
                      </div>
                      <p className="text-sm text-gray-600">
                        Este pedido ha sido completado. Los insumos ya no se pueden modificar.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card - Solo mostrar si está en proceso */}
          {canEditSupplies && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Insumos</p>
                    <p className="text-xl sm:text-2xl font-bold">{selectedSupplies?.supplies.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">En Uso Actual</p>
                    <p className="text-xl sm:text-2xl font-bold">{getTotalUsed().toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Consumos Previos</p>
                    <p className="text-xl sm:text-2xl font-bold">{consumptionHistory.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Estado</p>
                    <p
                      className={`text-xl sm:text-2xl font-bold ${hasValidationErrors() ? "text-red-600" : "text-green-600"}`}
                    >
                      {hasValidationErrors() ? "⚠️" : "✅"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supplies Table - Solo mostrar si está en proceso */}
          {canEditSupplies && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <CardTitle className="text-base sm:text-lg">Registro de Consumos</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">{showHistory ? "Ocultar" : "Ver"} Historial</span>
                    <span className="sm:hidden">{showHistory ? "Ocultar" : "Ver"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSupplies ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando insumos...</span>
                    </div>
                  </div>
                ) : selectedSupplies ? (
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gray-800">
                        <TableRow>
                          <TableHead className="text-white font-medium whitespace-nowrap">Insumo</TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap hidden sm:table-cell">
                            Requerido
                          </TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap">Disponible</TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap">Usar Ahora</TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSupplies.supplies.map((supply, index) => {
                          const isOverLimit = supply.used > supply.available
                          const isUnderRequired = supply.used < supply.required

                          return (
                            <TableRow key={supply.id} className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                              <TableCell className="font-medium">
                                <div className="max-w-[120px] truncate">{supply.name}</div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap hidden sm:table-cell">
                                {supply.required.toFixed(2)} {supply.unit}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <span
                                  className={supply.available < supply.required ? "text-orange-600 font-medium" : ""}
                                >
                                  {supply.available.toFixed(2)} {supply.unit}
                                </span>
                                {supply.available < supply.required && (
                                  <Badge variant="outline" className="ml-2 text-orange-600 text-xs">
                                    Bajo Stock
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={supply.used}
                                    onChange={(e) => handleUsageChange(supply.id, e.target.value)}
                                    className={`w-16 sm:w-20 text-sm ${
                                      isOverLimit
                                        ? "border-red-500 focus:border-red-500"
                                        : isUnderRequired
                                          ? "border-orange-400 focus:border-orange-400"
                                          : "focus:border-blue-500"
                                    }`}
                                    min="0"
                                    max={supply.available}
                                    step="0.1"
                                    placeholder="0"
                                    disabled={loading}
                                  />
                                  <span className="text-sm text-gray-600 whitespace-nowrap hidden sm:inline">
                                    {supply.unit}
                                  </span>
                                </div>
                                {isOverLimit && <p className="text-xs text-red-500 mt-1">Excede disponible</p>}
                                {isUnderRequired && !isOverLimit && supply.used > 0 && (
                                  <p className="text-xs text-orange-500 mt-1">Menos que requerido</p>
                                )}
                              </TableCell>
                              <TableCell>
                                {isOverLimit ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Error
                                  </Badge>
                                ) : supply.used >= supply.required ? (
                                  <Badge variant="default" className="bg-green-600 text-xs">
                                    Completo
                                  </Badge>
                                ) : supply.used > 0 ? (
                                  <Badge variant="outline" className="text-orange-600 text-xs">
                                    Parcial
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Pendiente
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay insumos configurados para este pedido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Consumption History - Solo mostrar si está en proceso y se solicita */}
          {canEditSupplies && showHistory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Historial de Consumos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {consumptionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Cantidad Consumida</TableHead>
                          <TableHead className="hidden sm:table-cell">Usuario</TableHead>
                          <TableHead className="hidden md:table-cell">Fecha/Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumptionHistory.map((consumption, index) => (
                          <TableRow key={consumption.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="max-w-[120px] truncate">
                              {consumption.supply_name || "Insumo eliminado"}
                            </TableCell>
                            <TableCell>
                              {consumption.consumed.toFixed(2)} {consumption.unidad_medida}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{consumption.user}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {consumption.timestamp.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay consumos registrados para este pedido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Solo mostrar si está en proceso */}
          {canEditSupplies && (
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="text-sm text-gray-600">
                {hasValidationErrors() && (
                  <p className="text-red-600 font-medium">⚠️ Hay errores de validación. Revisa las cantidades.</p>
                )}
                {!hasValidationErrors() && getTotalUsed() > 0 && (
                  <p className="text-green-600">✅ Listo para guardar consumos</p>
                )}
                {getTotalUsed() === 0 && <p className="text-gray-500">Ingresa las cantidades a consumir</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    selectedSupplies?.supplies.forEach((supply) => {
                      updateSupplyUsage(selectedOrderId, supply.id, 0)
                    })
                  }}
                  disabled={getTotalUsed() === 0 || loading}
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gray-800 hover:bg-gray-700"
                  disabled={hasValidationErrors() || getTotalUsed() === 0 || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Guardar Consumos
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </ProtectedRoute>
  )
}
