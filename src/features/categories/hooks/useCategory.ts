import { toast } from 'sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCategory, getCategories } from '../services/categories.service'

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

export const useGetCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}
