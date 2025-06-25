"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useProduction } from "@/components/production-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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
import { ChevronLeft, ChevronRight, Clock, User, Calendar, FileText, Eye, EyeOff } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function GestionPage() {
  const { orders, updateOrderStatus, getOrderStatusHistory, getAllStatusHistory } = useProduction()
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || "")
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState("")
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5)

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)
  const orderHistory = getOrderStatusHistory(selectedOrderId)
  const allHistory = getAllStatusHistory()

  const filteredHistory = showAllHistory
    ? allHistory.filter(
        (h) =>
          h.orderId.toLowerCase().includes(historyFilter.toLowerCase()) ||
          h.user.toLowerCase().includes(historyFilter.toLowerCase()) ||
          h.status.toLowerCase().includes(historyFilter.toLowerCase()),
      )
    : orderHistory

  const visibleHistory = filteredHistory.slice(0, visibleHistoryCount)
  const hasMoreHistory = filteredHistory.length > visibleHistoryCount

  const getProgressStep = (status: string) => {
    switch (status) {
      case "En cola":
        return 0
      case "En proceso":
        return 1
      case "Finalizado":
        return 2
      default:
        return 0
    }
  }

  const currentStep = selectedOrder ? getProgressStep(selectedOrder.status) : 0

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "En cola":
        return "secondary"
      case "En proceso":
        return "default"
      case "Finalizado":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive"
      case "Media":
        return "default"
      case "Baja":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const loadMoreHistory = () => {
    setVisibleHistoryCount((prev) => prev + 10)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigateOrder("prev")
      } else if (e.key === "ArrowRight") {
        navigateOrder("next")
      } else if (e.key === "i" && selectedOrder?.status === "En cola") {
        updateOrderStatus(selectedOrder.id, "En proceso")
      } else if (e.key === "f" && selectedOrder?.status === "En proceso") {
        updateOrderStatus(selectedOrder.id, "Finalizado")
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [selectedOrder])

  if (!selectedOrder) {
    return <div>Cargando...</div>
  }

  return (
    <ProtectedRoute requiredPermissions={["pedidos.leer", "pedidos.cambiar_estado"]}>
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
                  <BreadcrumbPage>Registro de Estado</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registro de Estado</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pedido: #{selectedOrder.id}</span>
              <Button variant="outline" size="icon" onClick={() => navigateOrder("prev")} title="Anterior (←)">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateOrder("next")} title="Siguiente (→)">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Order Context - Enhanced */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">Pedido: #{selectedOrder.id}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedOrder.priority)}>{selectedOrder.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Producto:
                  </span>
                  <p className="font-medium">{selectedOrder.product}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cantidad:</span>
                  <p className="font-medium">{selectedOrder.quantity} pares</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Cliente:
                  </span>
                  <p className="font-medium">{selectedOrder.client}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Creado:
                  </span>
                  <p className="font-medium text-sm">{selectedOrder.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Progreso del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
                <div className="flex items-center justify-center sm:justify-start">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep >= 0
                        ? "bg-gray-800 text-white shadow-lg"
                        : "bg-gray-200 text-gray-600 border-2 border-gray-300"
                    }`}
                  >
                    1
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium">En Cola</span>
                    <p className="text-xs text-gray-500">Esperando inicio</p>
                  </div>
                </div>

                <div
                  className={`hidden sm:block flex-1 h-2 mx-4 rounded-full transition-all duration-500 ${
                    currentStep >= 1 ? "bg-blue-400" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`sm:hidden w-full h-2 my-2 rounded-full transition-all duration-500 ${
                    currentStep >= 1 ? "bg-blue-400" : "bg-gray-200"
                  }`}
                />

                <div className="flex items-center justify-center sm:justify-start">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep >= 1
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-600 border-2 border-gray-300"
                    }`}
                  >
                    2
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium">En Proceso</span>
                    <p className="text-xs text-gray-500">Produciendo</p>
                  </div>
                </div>

                <div
                  className={`hidden sm:block flex-1 h-2 mx-4 rounded-full transition-all duration-500 ${
                    currentStep >= 2 ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`sm:hidden w-full h-2 my-2 rounded-full transition-all duration-500 ${
                    currentStep >= 2 ? "bg-green-400" : "bg-gray-200"
                  }`}
                />

                <div className="flex items-center justify-center sm:justify-start">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      currentStep >= 2
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-600 border-2 border-gray-300"
                    }`}
                  >
                    3
                  </div>
                  <div className="ml-3">
                    <span className="text-sm font-medium">Finalizado</span>
                    <p className="text-xs text-gray-500">Completado</p>
                  </div>
                </div>
              </div>

              {/* Progress percentage */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Progreso: <span className="font-medium">{Math.round((currentStep / 2) * 100)}%</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Acciones de Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  disabled={selectedOrder.status !== "En cola"}
                  onClick={() => updateOrderStatus(selectedOrder.id, "En proceso")}
                  title="Atajo: tecla I"
                >
                  <Clock className="h-4 w-4" />
                  Iniciar
                  {selectedOrder.status === "En cola" && <span className="text-xs opacity-75">(I)</span>}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  disabled={selectedOrder.status !== "En proceso"}
                  onClick={() => updateOrderStatus(selectedOrder.id, "Finalizado")}
                  title="Atajo: tecla F"
                >
                  <FileText className="h-4 w-4" />
                  Finalizar
                  {selectedOrder.status === "En proceso" && <span className="text-xs opacity-75">(F)</span>}
                </Button>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 break-words">
                  <strong>Último cambio:</strong> {selectedOrder.updatedAt.toLocaleString()} - Operario Juan
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Usa las flechas ← → para navegar entre pedidos, o las teclas I/F para cambiar estados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Seleccionar Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.id} - {order.product} ({order.status}) - {order.client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Status History - Enhanced */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base sm:text-lg">Historial de Cambios</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="flex items-center gap-2"
                  >
                    {showAllHistory ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="hidden sm:inline">
                      {showAllHistory ? "Solo este pedido" : "Todos los pedidos"}
                    </span>
                    <span className="sm:hidden">{showAllHistory ? "Solo este" : "Todos"}</span>
                  </Button>
                </div>
              </div>
              {showAllHistory && (
                <div className="mt-4">
                  <Input
                    placeholder="Filtrar por pedido, usuario o estado..."
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {visibleHistory.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gray-800">
                        <TableRow>
                          {showAllHistory && (
                            <TableHead className="text-white font-medium whitespace-nowrap">Pedido</TableHead>
                          )}
                          <TableHead className="text-white font-medium whitespace-nowrap">Estado</TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap">Usuario</TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap hidden sm:table-cell">
                            Fecha / Hora
                          </TableHead>
                          <TableHead className="text-white font-medium whitespace-nowrap hidden md:table-cell">
                            Notas
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleHistory.map((change, index) => (
                          <TableRow key={change.id} className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                            {showAllHistory && (
                              <TableCell className="font-medium whitespace-nowrap">#{change.orderId}</TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getStatusBadgeVariant(change.status)}
                                  className="whitespace-nowrap text-xs"
                                >
                                  {change.status}
                                </Badge>
                                {change.previousStatus && (
                                  <span className="text-xs text-gray-500 hidden sm:inline">
                                    ← {change.previousStatus}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[100px]">{change.user}</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {change.timestamp.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 max-w-xs truncate hidden md:table-cell">
                              {change.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {hasMoreHistory && (
                    <div className="p-4 text-center border-t">
                      <Button variant="outline" onClick={loadMoreHistory} className="flex items-center gap-2">
                        Ver más...
                        <span className="text-xs text-gray-500">
                          ({visibleHistoryCount} de {filteredHistory.length})
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay cambios registrados</p>
                  {showAllHistory && historyFilter && <p className="text-sm">Prueba con otro filtro</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </ProtectedRoute>
  )
}
