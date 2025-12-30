import { useEffect, useState, useCallback } from 'react'
import supabase from '@/utils/supabase'
import type { OrderWithDetails } from '../types/order'

export interface OrderNotification {
  id: string
  customer_name: string
  total: number
  order_type: string | null
  created_at: string
  order: OrderWithDetails
  read?: boolean
}

export const useOrderNotifications = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((notif) => {
        if (notif.id === notificationId && !notif.read) {
          return { ...notif, read: true }
        }
        return notif
      })
      const wasUnread = prev.find((n) => n.id === notificationId && !n.read)
      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      return updated
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      setUnreadCount(0)
      return prev.map((notif) => ({ ...notif, read: true }))
    })
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    // Subscribe to new orders
    const channel = supabase
      .channel('orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending',
        },
        async (payload) => {
          // Fetch the full order details
          try {
            const { data: orderData, error } = await supabase
              .from('orders')
              .select(
                `
                *,
                items:order_items(
                  *,
                  product:products(
                    id,
                    name,
                    sku,
                    category:categories(id, name)
                  ),
                  variant:product_variants(
                    id,
                    name,
                    sku
                  )
                )
              `,
              )
              .eq('id', payload.new.id)
              .single()

            if (error) {
              console.error('Error fetching order details:', error)
              return
            }

            const order: OrderWithDetails = {
              ...orderData,
              items: orderData.items?.map((item: any) => ({
                ...item,
                product_name: item.product?.name,
                product_sku: item.product?.sku,
                variant_name: item.variant?.name,
                variant_sku: item.variant?.sku,
                category_name: item.product?.category?.name,
              })),
            }

            const notification: OrderNotification = {
              id: payload.new.id,
              customer_name: payload.new.customer_name,
              total: payload.new.total,
              order_type: payload.new.order_type,
              created_at: payload.new.created_at,
              order,
            }

            setNotifications((prev) => [notification, ...prev])
            setUnreadCount((prev) => prev + 1)
          } catch (error) {
            console.error('Error processing order notification:', error)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}

