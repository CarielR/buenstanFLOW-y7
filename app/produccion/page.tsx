"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProduction } from "@/components/production-context"
import { Package, Clock, AlertTriangle, CheckCircle, Save, RefreshCw, Lock, Play, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProduccionPage() {
  const {
    orders,
    orderSupplies,
    supplyConsumptions,
    loading,
    updateOrderStatus,
    updateSupplyUsage,
    saveSupplyUsage,
    loadSuppliesForOrder,
    getSupplyConsumptions,
    getOrderStatusHistory,
  } = useProduction()

  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<string>("")
  const [savingSupplies, setSavingSupplies] = useState(false)

  // Cargar insumos cuando se selecciona un pedido
  useEffect(() => {
    if (selectedOrder && selectedOrder !== "") {
      console.log(`Cargando insumos para pedido seleccionado: ${selectedOrder}`)
      loadSuppliesForOrder(selectedOrder)
    }
  }, [selectedOrder, loadSuppliesForOrder])

  // Seleccionar automáticamente el primer pedido disponible
  useEffect(() => {
    if (orders.length > 0 && !selectedOrder) {
      const firstOrder = orders[0]
      console.log(`Seleccionando automáticamente el primer pedido: ${firstOrder.id}`)
      setSelectedOrder(firstOrder.id)
    }
  }, [orders, selectedOrder])

  const handleStatusUpdate = async (orderId: string, newStatus: "En proceso" | "Finalizado") => {
    try {
      // Validación especial para finalizar pedido
      if (newStatus === "Finalizado") {
        const orderSupply = orderSupplies.find((os) => os.orderId === orderId)
        const hasUnsavedChanges = orderSupply?.supplies.some((s) => s.used > 0) || false

        if (hasUnsavedChanges) {
          toast({
            title: "Consumos pendientes",
            description: "Debes guardar los consumos antes de finalizar el pedido",
            variant: "destructive",
          })
          return
        }
      }

      await updateOrderStatus(orderId, newStatus)

      if (newStatus === "Finalizado") {
        toast({
          title: "Pedido finalizado",
          description: "El pedido ha sido marcado como finalizado. Ya no se pueden modificar los insumos.",
        })
      }
    } catch (error) {
      console.error("Error actualizando estado:", error)
    }
  }

  const handleSaveSupplies = async () => {
    if (!selectedOrder) return

    const currentOrder = orders.find((o) => o.id === selectedOrder)
    if (!currentOrder) return

    // Verificar que el pedido esté en proceso
    if (currentOrder.status !== "En proceso") {
      toast({
        title: "Estado no válido",
        description: "Solo se pueden registrar consumos en pedidos que están en proceso",
        variant: "destructive",
      })
      return
    }

    setSavingSupplies(true)
    try {
      console.log(`Guardando consumos para pedido: ${selectedOrder}`)
      await saveSupplyUsage(selectedOrder)

      // Recargar insumos después de guardar
      setTimeout(() => {
        loadSuppliesForOrder(selectedOrder)
      }, 1000)
    } catch (error) {
      console.error("Error guardando insumos:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los consumos",
        variant: "destructive",
      })
    } finally {
      setSavingSupplies(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cola":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "En proceso":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Finalizado":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-800 border-red-200"
      case "Media":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Baja":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const currentOrderSupplies = orderSupplies.find((os) => os.orderId === selectedOrder)
  const currentOrder = orders.find((o) => o.id === selectedOrder)
  const orderHistory = selectedOrder ? getOrderStatusHistory(selectedOrder) : []
  const orderConsumptions = selectedOrder ? getSupplyConsumptions(selectedOrder) : []

  // Determinar si se pueden editar los insumos
  const canEditSupplies = currentOrder?.status === "En proceso"
  const isFinished = currentOrder?.status === "Finalizado"
  const isInQueue = currentOrder?.status === "En cola"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando datos de producción...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Producción</h2>
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">{orders.length} pedidos activos</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Lista de Pedidos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedidos Activos
            </CardTitle>
            <CardDescription>Selecciona un pedido para gestionar su producción</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOrder === order.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{order.id}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        {order.status === "Finalizado" && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>{order.product}</div>
                      <div>Cliente: {order.client}</div>
                      <div>Cantidad: {order.quantity} unidades</div>
                      <Badge className={getPriorityColor(order.priority)} variant="outline">
                        {order.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalles del Pedido Seleccionado */}
        <div className="md:col-span-2 space-y-4">
          {selectedOrder && currentOrder ? (
            <>
              {/* Información del Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pedido {selectedOrder}</span>
                    <div className="flex gap-2">
                      {currentOrder.status === "En cola" && (
                        <Button onClick={() => handleStatusUpdate(selectedOrder, "En proceso")} size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Producción
                        </Button>
                      )}
                      {currentOrder.status === "En proceso" && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedOrder, "Finalizado")}
                          size="sm"
                          variant="outline"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar Pedido
                        </Button>
                      )}
                      {currentOrder.status === "Finalizado" && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Finalizado
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Producto</Label>
                      <p className="text-sm text-muted-foreground">{currentOrder.product}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cliente</Label>
                      <p className="text-sm text-muted-foreground">{currentOrder.client}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cantidad</Label>
                      <p className="text-sm text-muted-foreground">{currentOrder.quantity} unidades</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estado</Label>
                      <Badge className={getStatusColor(currentOrder.status)}>{currentOrder.status}</Badge>
                    </div>
                  </div>

                  {/* Alertas de estado */}
                  {isInQueue && (
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Este pedido está en cola. Inicia la producción para poder registrar el consumo de insumos.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isFinished && (
                    <Alert className="mt-4">
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        Este pedido está finalizado. Los insumos ya no se pueden modificar. Solo puedes consultar el
                        historial de consumos.
                      </AlertDescription>
                    </Alert>
                  )}

                  {canEditSupplies && (
                    <Alert className="mt-4">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Este pedido está en producción. Puedes registrar el consumo de insumos en tiempo real.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="supplies" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="supplies">Insumos</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                  <TabsTrigger value="consumptions">Consumos</TabsTrigger>
                </TabsList>

                {/* Tab de Insumos */}
                <TabsContent value="supplies" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Gestión de Insumos</span>
                        {canEditSupplies && (
                          <Button
                            onClick={handleSaveSupplies}
                            disabled={savingSupplies || !currentOrderSupplies}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {savingSupplies ? "Guardando..." : "Guardar Consumos"}
                          </Button>
                        )}
                        {isFinished && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Solo lectura
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {canEditSupplies &&
                          "Registra el consumo de insumos para este pedido. El stock se actualizará automáticamente."}
                        {isInQueue && "Inicia la producción para poder registrar consumos de insumos."}
                        {isFinished && "Consulta los insumos que fueron consumidos en este pedido finalizado."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentOrderSupplies ? (
                        <div className="space-y-4">
                          {currentOrderSupplies.supplies.map((supply) => {
                            const availableForUse = supply.available
                            const progressPercentage = supply.required > 0 ? (supply.used / supply.required) * 100 : 0
                            const hasExcess = supply.used > availableForUse

                            return (
                              <div
                                key={supply.id}
                                className={`p-4 border rounded-lg space-y-3 ${
                                  isFinished ? "bg-muted/30" : canEditSupplies ? "" : "bg-muted/50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2">
                                      {supply.name}
                                      {isFinished && <Lock className="h-3 w-3 text-muted-foreground" />}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Requerido: {supply.required} {supply.unit} | Disponible: {availableForUse}{" "}
                                      {supply.unit}
                                    </p>
                                  </div>
                                  {hasExcess && canEditSupplies && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Excede stock
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Progreso de uso</span>
                                    <span>
                                      {supply.used} / {supply.required} {supply.unit} ({Math.round(progressPercentage)}
                                      %)
                                    </span>
                                  </div>
                                  <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`supply-${supply.id}`} className="text-sm font-medium">
                                    {canEditSupplies ? "Cantidad a consumir:" : "Cantidad consumida:"}
                                  </Label>
                                  <Input
                                    id={`supply-${supply.id}`}
                                    type="number"
                                    min="0"
                                    max={canEditSupplies ? availableForUse : undefined}
                                    step="0.1"
                                    value={supply.used}
                                    onChange={(e) =>
                                      canEditSupplies &&
                                      updateSupplyUsage(
                                        selectedOrder,
                                        supply.id,
                                        Number.parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    disabled={!canEditSupplies}
                                    className={`w-32 ${hasExcess && canEditSupplies ? "border-red-500" : ""} ${
                                      !canEditSupplies ? "bg-muted" : ""
                                    }`}
                                  />
                                  <span className="text-sm text-muted-foreground">{supply.unit}</span>
                                </div>

                                {!canEditSupplies && isInQueue && (
                                  <p className="text-xs text-muted-foreground">
                                    Inicia la producción para poder modificar este valor
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Cargando insumos para este pedido...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab de Historial */}
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Estados</CardTitle>
                      <CardDescription>Seguimiento de cambios de estado del pedido</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {orderHistory.map((change, index) => (
                            <div key={change.id} className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">{index + 1}</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(change.status)}>{change.status}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {change.timestamp.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Por: {change.user}
                                  {change.notes && ` - ${change.notes}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab de Consumos */}
                <TabsContent value="consumptions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Consumos</CardTitle>
                      <CardDescription>Registro de insumos consumidos en este pedido</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {orderConsumptions.length > 0 ? (
                            orderConsumptions.map((consumption) => (
                              <div
                                key={consumption.id}
                                className="flex items-center justify-between p-3 border rounded"
                              >
                                <div>
                                  <p className="font-medium">
                                    {consumption.supply_name || `Insumo ${consumption.supplyId}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {consumption.consumed} {consumption.unidad_medida || "u"} - {consumption.user}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {consumption.timestamp.toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">No hay consumos registrados para este pedido</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Selecciona un pedido para ver los detalles de producción</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
