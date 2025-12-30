import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { useGetOrders, useUpdateOrderStatus } from '../hooks'
import type { OrderStatus, OrderWithDetails } from '../types/order'
import { Header } from '@/components'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusColors: Record<'pending' | 'processing', string> = {
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-blue-500 text-white',
}

const statusLabels: Record<'pending' | 'processing', string> = {
  pending: 'Pending',
  processing: 'Processing',
}

const nextStatusMap: Record<'pending' | 'processing', Array<OrderStatus>> = {
  pending: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'cancelled'],
}

function formatTimeElapsed(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`
  }
  return `${diffSeconds}s`
}

export default function QueueOrders() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: orders, isLoading, refetch } = useGetOrders()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()

  // Filter to show only pending and processing orders, sorted by created_at (oldest first)
  const queueOrders = useMemo(() => {
    if (!orders) return []
    return orders
      .filter(
        (order: OrderWithDetails) =>
          order.status === 'pending' || order.status === 'processing',
      )
      .sort((a: OrderWithDetails, b: OrderWithDetails) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB // Oldest first
      })
  }, [orders])

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      updateStatus(
        { id: orderId, status: newStatus },
        {
          onSuccess: () => {
            refetch()
          },
        },
      )
    },
    [updateStatus, refetch],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    refetch().finally(() => setRefreshing(false))
  }, [refetch])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [refetch])

  // Memoize filtered orders to avoid recalculating on every render
  const pendingOrders = useMemo(
    () => queueOrders.filter((o: OrderWithDetails) => o.status === 'pending'),
    [queueOrders],
  )

  const processingOrders = useMemo(
    () =>
      queueOrders.filter((o: OrderWithDetails) => o.status === 'processing'),
    [queueOrders],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Header
            title="Order Queue"
            description="Monitor and manage pending and processing orders. Update order status to move them through the queue."
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="shrink-0"
        >
          {refreshing || isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading orders...
        </div>
      ) : queueOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No orders in queue
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending Orders Section */}
          {pendingOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0" />
                <span className="truncate">
                  Pending Orders ({pendingOrders.length})
                </span>
              </h2>
              <div className="space-y-3">
                {pendingOrders.map((order: OrderWithDetails) => {
                  const availableStatuses =
                    nextStatusMap[order.status as 'pending' | 'processing']
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      isUpdating={isUpdating}
                      availableStatuses={availableStatuses}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Processing Orders Section */}
          {processingOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-spin shrink-0" />
                <span className="truncate">
                  Processing Orders ({processingOrders.length})
                </span>
              </h2>
              <div className="space-y-3">
                {processingOrders.map((order: OrderWithDetails) => {
                  const availableStatuses =
                    nextStatusMap[order.status as 'pending' | 'processing']
                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      isUpdating={isUpdating}
                      availableStatuses={availableStatuses}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface OrderCardProps {
  order: OrderWithDetails
  onStatusChange: (orderId: string, status: OrderStatus) => void
  isUpdating: boolean
  availableStatuses: Array<OrderStatus>
}

const OrderCard = memo(
  function OrderCard({
    order,
    onStatusChange,
    isUpdating,
    availableStatuses,
  }: OrderCardProps) {
    const [timeElapsed, setTimeElapsed] = useState(() =>
      formatTimeElapsed(order.created_at),
    )

    // Update time elapsed every second
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeElapsed(formatTimeElapsed(order.created_at))
      }, 1000)
      return () => clearInterval(interval)
    }, [order.created_at])

    // Memoize status change handler for this specific order
    const handleStatusChangeForOrder = useCallback(
      (value: string) => {
        onStatusChange(order.id, value as OrderStatus)
      },
      [order.id, onStatusChange],
    )

    // Memoize displayed items to avoid recalculating on every render
    const displayedItems = useMemo(() => {
      if (!order.items || order.items.length === 0) return null
      return order.items.slice(0, 3)
    }, [order.items])

    const remainingItemsCount = useMemo(() => {
      if (!order.items || order.items.length <= 3) return 0
      return order.items.length - 3
    }, [order.items])

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">
                {order.customer_name}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`${statusColors[order.status as 'pending' | 'processing']} shrink-0`}
                >
                  {statusLabels[order.status as 'pending' | 'processing']}
                </Badge>
                {order.order_type && (
                  <Badge variant="outline" className="capitalize shrink-0">
                    {order.order_type}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="text-base sm:text-lg font-semibold">
                ₱{Number(order.total).toFixed(2)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">In queue: {timeElapsed}</span>
          </div>

          {displayedItems && (
            <div className="text-xs sm:text-sm">
              <div className="font-medium mb-1">Items:</div>
              <div className="space-y-1">
                {displayedItems.map((item: any, idx: number) => {
                  const addOns = item.add_ons || []
                  return (
                    <div key={idx} className="text-muted-foreground">
                      <div>
                        • {item.product_name || 'Unknown Product'}
                        {item.variant_name && ` (${item.variant_name})`} x{' '}
                        {item.quantity}
                      </div>
                      {addOns.length > 0 && (
                        <div className="ml-4 mt-0.5 space-y-0.5 text-xs">
                          {addOns.slice(0, 2).map((addOn: any, addOnIdx: number) => {
                            const addOnQuantity = addOn.quantity || 1
                            return (
                              <div key={addOnIdx} className="text-stone-500">
                                - {addOn.name}: {addOn.value}
                                {addOnQuantity > 1 && ` ×${addOnQuantity}`}
                              </div>
                            )
                          })}
                          {addOns.length > 2 && (
                            <div className="text-stone-400">
                              +{addOns.length - 2} more add-on(s)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {remainingItemsCount > 0 && (
                  <div className="text-muted-foreground">
                    +{remainingItemsCount} more item(s)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t">
            <span className="text-xs sm:text-sm font-medium sm:flex-1 shrink-0">
              Update Status:
            </span>
            <Select
              value=""
              onValueChange={handleStatusChangeForOrder}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                      {status === 'cancelled' && (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      {status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <span className="capitalize">{status}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.order.id === nextProps.order.id &&
      prevProps.order.status === nextProps.order.status &&
      prevProps.order.total === nextProps.order.total &&
      prevProps.order.customer_name === nextProps.order.customer_name &&
      prevProps.order.created_at === nextProps.order.created_at &&
      prevProps.isUpdating === nextProps.isUpdating &&
      prevProps.availableStatuses.length ===
        nextProps.availableStatuses.length &&
      prevProps.availableStatuses.every(
        (status, idx) => status === nextProps.availableStatuses[idx],
      ) &&
      prevProps.onStatusChange === nextProps.onStatusChange
    )
  },
)
