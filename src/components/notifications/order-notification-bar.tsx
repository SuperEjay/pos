import { useState } from 'react'
import { Bell, X, CheckCheck, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useOrderNotifications } from '@/features/orders/hooks/useOrderNotifications'
import { OrderViewDialog } from '@/features/orders/components/order-view-dialog'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function OrderNotificationBar() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useOrderNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const handleNotificationClick = (notificationId: string) => {
    // Mark as read
    markAsRead(notificationId)
    // Open order view dialog
    setViewingOrderId(notificationId)
    setIsViewDialogOpen(true)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'just now'
    }
  }

  const getOrderTypeBadge = (orderType: string | null) => {
    if (!orderType) return null
    const colors: Record<string, string> = {
      pickup: 'bg-blue-100 text-blue-700',
      delivery: 'bg-green-100 text-green-700',
      dine_in: 'bg-purple-100 text-purple-700',
    }
    return (
      <Badge className={cn('text-xs', colors[orderType] || 'bg-stone-100 text-stone-700')}>
        {orderType.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] flex flex-col p-0">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg sm:text-xl font-bold">Order Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-8 px-2"
              >
                <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {notifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 text-stone-500">
              <div className="text-center">
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">No new orders</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-4 sm:px-6 py-4 sm:py-5">
                <div className="space-y-2 sm:space-y-3">
                  {notifications.map((notification) => {
                    const isRead = notification.read || false
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={cn(
                          'p-3 sm:p-4 rounded-lg border cursor-pointer transition-all',
                          isRead
                            ? 'bg-white border-stone-200'
                            : 'bg-stone-50 border-stone-300 shadow-sm',
                        )}
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ShoppingCart className="h-4 w-4 text-stone-600 flex-shrink-0" />
                            <span className="font-semibold text-sm truncate">
                              {notification.customer_name}
                            </span>
                            {!isRead && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {getOrderTypeBadge(notification.order_type)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base sm:text-lg font-bold text-stone-900">
                            ₱{Number(notification.total).toFixed(2)}
                          </span>
                          <span className="text-xs text-stone-500 whitespace-nowrap">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        {notification.order.items && notification.order.items.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-stone-200">
                            <p className="text-xs text-stone-600">
                              {notification.order.items.length} item
                              {notification.order.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
              {notifications.length > 0 && (
                <div className="border-t border-stone-200 px-4 sm:px-6 py-3 sm:py-4 bg-stone-50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearNotifications}
                    className="w-full h-9 sm:h-10 text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Clear all notifications
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>

      {/* Order View Dialog */}
      <OrderViewDialog
        open={isViewDialogOpen}
        onOpenChange={(open) => {
          setIsViewDialogOpen(open)
          if (!open) {
            setViewingOrderId(null)
          }
        }}
        orderId={viewingOrderId}
      />
    </Sheet>
  )
}

