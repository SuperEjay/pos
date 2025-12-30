import { memo, useEffect, useMemo } from 'react'
import { EyeIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetOrder } from '../hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface OrderViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-blue-500 text-white',
  completed: 'bg-green-500 text-white',
  cancelled: 'bg-red-500 text-white',
  refunded: 'bg-gray-500 text-white',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const OrderViewDialog = memo(function OrderViewDialog({
  open,
  onOpenChange,
  orderId,
}: OrderViewDialogProps) {
  const queryClient = useQueryClient()
  const { data: order, isLoading } = useGetOrder(orderId)

  // Invalidate and refetch order data when dialog opens
  useEffect(() => {
    if (open && orderId) {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    }
  }, [open, orderId, queryClient])

  // Move useMemo before early returns to follow Rules of Hooks
  const items = useMemo(() => order?.items || [], [order?.items])

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Loading order information...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Order Not Found</DialogTitle>
            <DialogDescription>
              The order you're looking for doesn't exist.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Order Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Information</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Customer Name
                  </label>
                  <p className="text-base font-medium">{order.customer_name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div>
                    <Badge
                      variant="outline"
                      className={statusColors[order.status] || 'bg-gray-500'}
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order Date
                  </label>
                  <p className="text-base">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order Type
                  </label>
                  <p className="text-base">
                    {order.order_type
                      ? order.order_type.charAt(0).toUpperCase() +
                        order.order_type.slice(1)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {order.order_type === 'delivery' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Delivery Fee
                    </label>
                    <p className="text-base">
                      ₱{Number(order.delivery_fee || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </label>
                  <p className="text-base">
                    {order.payment_method
                      ? order.payment_method.charAt(0).toUpperCase() +
                        order.payment_method.slice(1)
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total
                  </label>
                  <p className="text-base font-semibold">
                    ₱{Number(order.total).toFixed(2)}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <p className="text-base whitespace-pre-wrap bg-stone-50 border border-stone-200 rounded-md p-3 mt-1">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Order Items ({items.length})
              </h3>
              <div className="space-y-4">
                {items.map((item: any, index: number) => {
                  const addOns = item.add_ons || []
                  const addOnsTotal = addOns.reduce((sum: number, addOn: any) => {
                    return sum + (addOn.price || 0) * (addOn.quantity || 1) * item.quantity
                  }, 0)
                  const itemTotal = Number(item.subtotal) + addOnsTotal

                  return (
                    <div
                      key={item.id || index}
                      className="border border-stone-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base">
                          {item.product_name || 'Unknown Product'}
                        </h4>
                        <div className="text-sm font-semibold">
                          ₱{itemTotal.toFixed(2)}
                          {addOnsTotal > 0 && (
                            <span className="text-xs text-stone-500 ml-1">
                              (Base: ₱{Number(item.subtotal).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">
                            Product SKU
                          </label>
                          <p>{item.product_sku || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">
                            Variant
                          </label>
                          <p>
                            {item.variant_name
                              ? `${item.variant_name}${item.variant_sku ? ` (${item.variant_sku})` : ''}`
                              : 'N/A'}
                          </p>
                        </div>
                        {item.category_name && (
                          <div>
                            <label className="text-muted-foreground">
                              Category
                            </label>
                            <p>{item.category_name}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-muted-foreground">Quantity</label>
                          <p>{item.quantity}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">
                            Unit Price
                          </label>
                          <p>₱{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">
                            Base Subtotal
                          </label>
                          <p className="font-semibold">
                            ₱{Number(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Add-ons Display */}
                      {addOns.length > 0 && (
                        <div className="pt-2 border-t border-stone-200">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Add-ons:
                          </label>
                          <div className="space-y-1">
                            {addOns.map((addOn: any, addOnIndex: number) => {
                              const addOnQuantity = addOn.quantity || 1
                              const addOnTotal = (addOn.price || 0) * addOnQuantity * item.quantity
                              return (
                                <div
                                  key={addOnIndex}
                                  className="flex items-center justify-between text-sm bg-stone-50 rounded px-2 py-1"
                                >
                                  <span className="text-stone-700">
                                    {addOn.name}: {addOn.value}
                                    {addOnQuantity > 1 && (
                                      <span className="text-stone-500 ml-1">×{addOnQuantity}</span>
                                    )}
                                  </span>
                                  {addOn.price > 0 && (
                                    <span className="font-semibold text-stone-900">
                                      +₱{addOnTotal.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                            {addOnsTotal > 0 && (
                              <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-stone-200 mt-1">
                                <span>Add-ons Total:</span>
                                <span>₱{addOnsTotal.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <>
              <Separator />
              <div className="text-center text-muted-foreground py-4">
                No items in this order.
              </div>
            </>
          )}

          {/* Order Summary */}
          <Separator />
          <div className="space-y-2">
            {order.order_type === 'delivery' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Delivery Fee:</span>
                <span>₱{Number(order.delivery_fee || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>₱{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Metadata */}
          <Separator />
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(order.created_at).toLocaleString()}
            </div>
            {order.updated_at && (
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(order.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

