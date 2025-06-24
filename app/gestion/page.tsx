// Archivo: app/gestion/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { useProduction } from '@/components/production-context'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Clock, User, Calendar, FileText, Eye, EyeOff } from 'lucide-react'

export default function GestionPage() {
  const { orders, updateOrderStatus, getOrderStatusHistory, getAllStatusHistory } = useProduction()
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? '')
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('')
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5)

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)
  const orderHistory = getOrderStatusHistory(selectedOrderId)
  const allHistory = getAllStatusHistory()

  const filteredHistory = showAllHistory
    ? allHistory.filter(
        (h) =>
          h.orderId.toLowerCase().includes(historyFilter.toLowerCase()) ||
          h.user.toLowerCase().includes(historyFilter.toLowerCase()) ||
          h.status.toLowerCase().includes(historyFilter.toLowerCase())
      )
    : orderHistory

  const visibleHistory = filteredHistory.slice(0, visibleHistoryCount)
  const hasMoreHistory = filteredHistory.length > visibleHistoryCount

  const getProgressStep = (status: string) => {
    switch (status) {
      case 'En cola':
        return 0
      case 'En proceso':
        return 1
      case 'Finalizado':
        return 2
      default:
        return 0
    }
  }

  const currentStep = selectedOrder ? getProgressStep(selectedOrder.status) : 0

  // Memoiza estas funciones para que no cambien en cada render
  const navigateOrder = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIndex = orders.findIndex((o) => o.id === selectedOrderId)
      let newIndex =
        direction === 'prev'
          ? (currentIndex > 0 ? currentIndex - 1 : orders.length - 1)
          : (currentIndex < orders.length - 1 ? currentIndex + 1 : 0)
      setSelectedOrderId(orders[newIndex].id)
    },
    [orders, selectedOrderId]
  )

  const updateStatus = useCallback(
    (status: string) => {
      if (selectedOrder) {
        updateOrderStatus(selectedOrder.id, status)
      }
    },
    [selectedOrder, updateOrderStatus]
  )

  // Manejo de atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateOrder('prev')
      } else if (e.key === 'ArrowRight') {
        navigateOrder('next')
      } else if (e.key === 'i' && selectedOrder?.status === 'En cola') {
        updateStatus('En proceso')
      } else if (e.key === 'f' && selectedOrder?.status === 'En proceso') {
        updateStatus('Finalizado')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigateOrder, updateStatus, selectedOrder])

  const loadMoreHistory = () => {
    setVisibleHistoryCount((prev) => prev + 5)
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Pedidos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Navegación entre pedidos */}
        <div className="p-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Pedido: #{selectedOrder?.id}</span>
          <Button variant="outline" size="icon" onClick={() => navigateOrder('prev')} title="Anterior (←)">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateOrder('next')} title="Siguiente (→)">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progreso */}
        <Card className="mx-4 mb-4">
          <CardHeader>
            <CardTitle>Progreso del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {[0, 1, 2].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step + 1}
                  </div>
                  {step < 2 && <div className={`flex-1 h-1 ${currentStep > step ? 'bg-blue-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial */}
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="sm" onClick={() => setShowAllHistory(!showAllHistory)}>
              {showAllHistory ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showAllHistory ? 'Solo este pedido' : 'Todos los pedidos'}</span>
            </Button>
            {showAllHistory && (
              <Input
                placeholder="Filtrar historial..."
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="max-w-xs"
              />
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {showAllHistory && <TableHead>Pedido</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleHistory.map((h, idx) => (
                <TableRow key={h.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {showAllHistory && <TableCell>#{h.orderId}</TableCell>}
                  <TableCell>
                    <Badge variant="outline">{h.status}</Badge>
                  </TableCell>
                  <TableCell>{h.user}</TableCell>
                  <TableCell>{h.timestamp.toLocaleString()}</TableCell>
                  <TableCell>{h.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMoreHistory && (
            <div className="mt-2 text-center">
              <Button variant="outline" onClick={loadMoreHistory}>
                Ver más ( {visibleHistory.length} / {filteredHistory.length} )
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </>
  )
}
