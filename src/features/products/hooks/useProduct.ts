import { toast } from 'sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProduct,
  deleteProduct,
  getProducts,
  toggleProductStatus,
  updateProduct,
} from '../services/products.service'

export const useAddProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      toast.success('Product added successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Failed to add product')
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Failed to update product')
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Failed to delete product')
    },
  })
}

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProductStatus(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        `Product ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      )
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => {
      toast.error('Failed to update product status')
    },
  })
}

export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
}

