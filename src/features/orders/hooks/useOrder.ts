import { toast } from 'sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addOrder,
  deleteOrder,
  getOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
  type GetOrdersFilters,
} from '../services/orders.service'
import type { OrderStatus } from '../types/order'

export const useAddOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addOrder,
    onSuccess: () => {
      toast.success('Order added successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Failed to add order')
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      toast.success('Order updated successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Failed to update order')
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      toast.success('Order deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Failed to delete order')
    },
  })
}

export const useGetOrders = (filters?: GetOrdersFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
  })
}

export const useGetOrder = (id: string | null) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => {
      toast.error('Failed to update order status')
    },
  })
}

