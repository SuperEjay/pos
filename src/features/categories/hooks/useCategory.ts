import { toast } from 'sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCategory,
  deleteCategory,
  getCategories,
  toggleCategoryStatus,
  updateCategory,
} from '../services/categories.service'

export const useAddCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      toast.success('Category added successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => {
      toast.error('Failed to add category')
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast.success('Category updated successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => {
      toast.error('Failed to update category')
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => {
      toast.error('Failed to delete category')
    },
  })
}

export const useToggleCategoryStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCategoryStatus(id, isActive),
    onSuccess: (_, variables) => {
      toast.success(
        `Category ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      )
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: () => {
      toast.error('Failed to update category status')
    },
  })
}

export const useGetCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}
