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

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
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
      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Order Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No new orders</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {notifications.map((notification) => {
                    const isRead = notification.read || false
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id)}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all',
                          isRead
                            ? 'bg-white border-stone-200'
                            : 'bg-stone-50 border-stone-300 shadow-sm',
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-stone-600" />
                            <span className="font-semibold text-sm">
                              {notification.customer_name}
                            </span>
                            {!isRead && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          {getOrderTypeBadge(notification.order_type)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-stone-900">
                            ₱{Number(notification.total).toFixed(2)}
                          </span>
                          <span className="text-xs text-stone-500">
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
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearNotifications}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear all notifications
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

