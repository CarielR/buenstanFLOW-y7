"use client"

import { useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useProduction } from "@/components/production-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Clock,
  Package,
  CheckCircle,
  Timer,
  HelpCircle,
  Plus,
  Download,
  ArrowUpDown,
  Calendar,
  Filter,
  Search,
  Users,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function PanelPage() {
  const { orders, updateOrderStatus, addNewOrder, getKPIs } = useProduction()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [visibleCount, setVisibleCount] = useState(10)
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [newOrder, setNewOrder] = useState({
    product: "",
    quantity: "",
    priority: "Media" as "Alta" | "Media" | "Baja",
    client: "",
    notes: "",
  })

  const kpis = getKPIs()

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter

      let matchesDate = true
      if (dateFilter !== "all") {
        const today = new Date()
        const orderDate = order.createdAt

        switch (dateFilter) {
          case "today":
            matchesDate = orderDate.toDateString() === today.toDateString()
            break
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = orderDate >= weekAgo
            break
          case "month":
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = orderDate >= monthAgo
            break
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDate
    })

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "id":
          aValue = a.id
          bValue = b.id
          break
        case "product":
          aValue = a.product
          bValue = b.product
          break
        case "quantity":
          aValue = a.quantity
          bValue = b.quantity
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "priority":
          const priorityOrder = { Alta: 3, Media: 2, Baja: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case "client":
          aValue = a.client
          bValue = b.client
          break
        case "date":
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        default:
          aValue = a.id
          bValue = b.id
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }
    })

    return filtered
  }, [orders, searchTerm, statusFilter, priorityFilter, dateFilter, sortBy, sortOrder])

  const visibleOrders = filteredAndSortedOrders.slice(0, visibleCount)
  const hasMoreOrders = filteredAndSortedOrders.length > visibleCount

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10)
  }

  const exportData = () => {
    const csvContent = [
      ["ID", "Producto", "Cantidad", "Estado", "Prioridad", "Cliente", "Fecha Creación"],
      ...filteredAndSortedOrders.map((order) => [
        order.id,
        order.product,
        order.quantity.toString(),
        order.status,
        order.priority,
        order.client,
        order.createdAt.toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pedidos_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNewOrder = () => {
    // Validar campos requeridos
    if (!newOrder.product.trim() || !newOrder.quantity.trim() || !newOrder.client.trim()) {
      return
    }

    const quantity = Number.parseInt(newOrder.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      return
    }

    // Agregar el nuevo pedido usando la función del contexto
    addNewOrder({
      product: newOrder.product.trim(),
      quantity: quantity,
      priority: newOrder.priority,
      client: newOrder.client.trim(),
      notes: newOrder.notes.trim(),
    })

    // Limpiar el formulario y cerrar el dialog
    setShowNewOrderDialog(false)
    setNewOrder({
      product: "",
      quantity: "",
      priority: "Media",
      client: "",
      notes: "",
    })
  }

  return (
    <ProtectedRoute requiredPermissions={["pedidos.leer"]}>
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
                  <BreadcrumbPage>Panel de Pedidos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pedidos en Producción</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={exportData} title="Exportar datos">
                <Download className="h-4 w-4" />
              </Button>
              <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Ayuda - Diagrama de flujo">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Diagrama de Flujo - Proceso de Producción</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold mb-4">Flujo de Estados de Pedidos</h3>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        {/* En Cola */}
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mb-2">
                            EN COLA
                          </div>
                          <p className="text-sm text-gray-600">Pedido creado</p>
                          <p className="text-xs text-gray-500">Esperando recursos</p>
                        </div>

                        <div className="hidden md:block text-2xl text-gray-400">→</div>
                        <div className="md:hidden text-2xl text-gray-400 rotate-90">→</div>

                        {/* En Proceso */}
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mb-2">
                            PROCESO
                          </div>
                          <p className="text-sm text-gray-600">Produciendo</p>
                          <p className="text-xs text-gray-500">Consumiendo insumos</p>
                        </div>

                        <div className="hidden md:block text-2xl text-gray-400">→</div>
                        <div className="md:hidden text-2xl text-gray-400 rotate-90">→</div>

                        {/* Finalizado */}
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mb-2">
                            FINAL
                          </div>
                          <p className="text-sm text-gray-600">Completado</p>
                          <p className="text-xs text-gray-500">Listo para entrega</p>
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold text-gray-800 mb-2">📦 En Cola</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Pedido registrado</li>
                            <li>• Esperando inicio</li>
                            <li>• Puede iniciarse</li>
                          </ul>
                        </div>
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold text-blue-600 mb-2">🔄 En Proceso</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Producción activa</li>
                            <li>• Consumiendo insumos</li>
                            <li>• Puede finalizarse</li>
                          </ul>
                        </div>
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold text-green-600 mb-2">✅ Finalizado</h4>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Producción completa</li>
                            <li>• Insumos registrados</li>
                            <li>• Listo para entrega</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">📦 Total en Cola</CardTitle>
                <Package className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{kpis.totalInQueue}</div>
                <p className="text-xs text-gray-500">pedidos esperando</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">🔄 En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{kpis.inProcess}</div>
                <p className="text-xs text-gray-500">pares produciendo</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">✅ Finalizados Hoy</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{kpis.finishedToday}</div>
                <p className="text-xs text-gray-500">pedidos completados</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">⏱️ T. Promedio</CardTitle>
                <Timer className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{kpis.averageTime}h</div>
                <p className="text-xs text-gray-500">tiempo por pedido</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Filtros y Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por código, producto o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="En cola">En cola</SelectItem>
                      <SelectItem value="En proceso">En proceso</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las prioridades</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fecha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las fechas</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gray-800 hover:bg-gray-700 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nuevo Pedido</span>
                        <span className="sm:hidden">Nuevo</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="product">Producto *</Label>
                          <Input
                            id="product"
                            value={newOrder.product}
                            onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
                            placeholder="Ej: Zapato Deportivo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity">Cantidad *</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newOrder.quantity}
                            onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                            placeholder="Ej: 50"
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="client">Cliente *</Label>
                          <Input
                            id="client"
                            value={newOrder.client}
                            onChange={(e) => setNewOrder({ ...newOrder, client: e.target.value })}
                            placeholder="Ej: Cliente ABC"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Prioridad</Label>
                          <Select
                            value={newOrder.priority}
                            onValueChange={(value: "Alta" | "Media" | "Baja") =>
                              setNewOrder({ ...newOrder, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Alta">Alta</SelectItem>
                              <SelectItem value="Media">Media</SelectItem>
                              <SelectItem value="Baja">Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="notes">Notas (opcional)</Label>
                          <Textarea
                            id="notes"
                            value={newOrder.notes}
                            onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                            placeholder="Notas adicionales..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleNewOrder}
                            className="flex-1"
                            disabled={
                              !newOrder.product.trim() ||
                              !newOrder.quantity.trim() ||
                              !newOrder.client.trim() ||
                              isNaN(Number.parseInt(newOrder.quantity)) ||
                              Number.parseInt(newOrder.quantity) <= 0
                            }
                          >
                            Crear Pedido
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewOrderDialog(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Results summary */}
                <div className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span>
                    Mostrando {visibleOrders.length} de {filteredAndSortedOrders.length} pedidos
                  </span>
                  {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setPriorityFilter("all")
                        setDateFilter("all")
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-800">
                    <TableRow>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center gap-1">
                          Pedido
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700"
                        onClick={() => handleSort("product")}
                      >
                        <div className="flex items-center gap-1">
                          Producto
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700 hidden sm:table-cell"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center gap-1">
                          Cantidad
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1">
                          Estado
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700 hidden md:table-cell"
                        onClick={() => handleSort("priority")}
                      >
                        <div className="flex items-center gap-1">
                          Prioridad
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700 hidden lg:table-cell"
                        onClick={() => handleSort("client")}
                      >
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Cliente
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-white font-medium whitespace-nowrap cursor-pointer hover:bg-gray-700 hidden xl:table-cell"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-white font-medium whitespace-nowrap">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleOrders.map((order, index) => (
                      <TableRow key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                        <TableCell className="font-medium whitespace-nowrap">#{order.id}</TableCell>
                        <TableCell className="whitespace-nowrap max-w-[150px] truncate">{order.product}</TableCell>
                        <TableCell className="whitespace-nowrap hidden sm:table-cell">{order.quantity} pares</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="whitespace-nowrap text-xs">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={getPriorityBadgeVariant(order.priority)}
                            className="whitespace-nowrap text-xs"
                          >
                            {order.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap max-w-[120px] truncate">
                          {order.client}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell whitespace-nowrap text-sm">
                          {order.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.status === "En cola" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1"
                              onClick={() => updateOrderStatus(order.id, "En proceso")}
                            >
                              Iniciar
                            </Button>
                          )}
                          {order.status === "En proceso" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                              onClick={() => updateOrderStatus(order.id, "Finalizado")}
                            >
                              Finalizar
                            </Button>
                          )}
                          {order.status === "Finalizado" && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              Completado
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Load More Button for Mobile */}
              {hasMoreOrders && (
                <div className="p-4 text-center border-t">
                  <Button variant="outline" onClick={loadMore} className="flex items-center gap-2">
                    Cargar más...
                    <span className="text-xs text-gray-500">
                      ({visibleCount} de {filteredAndSortedOrders.length})
                    </span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </ProtectedRoute>
  )
}
