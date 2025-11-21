import { useState, useMemo, useCallback } from 'react'

import { PlusIcon } from 'lucide-react'
import {
  useDeleteOrder,
  useGetOrders,
} from '../hooks'
import { OrderModal } from './order-modal'
import { OrderViewDialog } from './order-view-dialog'
import { OrdersTable } from './orders-table'
import type { OrderTableRow } from './orders-table'
import type { Order } from '@/features/orders/types'
import type { GetOrdersFilters } from '../services/orders.service'

import { Button } from '@/components/ui/button'
import { Header } from '@/components'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useGetCategories } from '@/features/categories/hooks'

export default function Orders() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [filters, setFilters] = useState<GetOrdersFilters>({})

  const { data: orders, isLoading } = useGetOrders(filters)
  const { data: categories } = useGetCategories()
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder()

  // Map the orders to the OrderTableRow type
  const mappedOrders: Array<OrderTableRow> = useMemo(
    () =>
      orders?.map((order: any) => ({
        id: order.id,
        customer_name: order.customer_name,
        status: order.status,
        total: order.total,
        order_date: order.order_date,
        order_type: order.order_type || null,
        delivery_fee: order.delivery_fee || null,
        payment_method: order.payment_method || null,
        notes: order.notes || null,
        created_at: order.created_at,
        updated_at: order.updated_at || order.created_at,
      })) ?? [],
    [orders],
  )

  const handleCreate = useCallback(() => {
    setEditingOrder(null)
    setIsModalOpen(true)
  }, [])

  const handleView = useCallback((orderId: string) => {
    setViewingOrderId(orderId)
    setIsViewDialogOpen(true)
  }, [])

  const handleEdit = useCallback((order: OrderTableRow) => {
    setEditingOrder({
      id: order.id,
      customer_name: order.customer_name,
      status: order.status,
      total: order.total,
      order_date: order.order_date,
      order_type: order.order_type,
      delivery_fee: order.delivery_fee,
      payment_method: order.payment_method,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
    })
    setIsModalOpen(true)
  }, [])

  const handleDeleteClick = useCallback((orderId: string) => {
    setOrderToDelete(orderId)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (orderToDelete) {
      deleteOrder(orderToDelete)
      setOrderToDelete(null)
    }
  }, [orderToDelete, deleteOrder])

  const orderToDeleteName = useMemo(
    () =>
      orderToDelete &&
      mappedOrders.find((ord) => ord.id === orderToDelete)?.customer_name,
    [orderToDelete, mappedOrders],
  )

  return (
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="Orders"
          description="Manage your orders here. You can add, edit, view, and delete orders."
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="w-4 h-4" />
              Add Order
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading orders...
            </div>
          ) : (
            <OrdersTable
              data={mappedOrders}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />
          )}
        </div>
      </div>

      <OrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        order={editingOrder}
      />

      <OrderViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        orderId={viewingOrderId}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        description={
          orderToDeleteName
            ? `Are you sure you want to delete the order for "${orderToDeleteName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this order? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}

