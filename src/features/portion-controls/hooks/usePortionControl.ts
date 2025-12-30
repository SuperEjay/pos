import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPortionControl,
  deletePortionControl,
  getPortionControl,
  getPortionControls,
  getProductVariantOptions,
  updatePortionControl,
} from '../services/portion-controls.service'
import type { PortionControlFormValues } from '../schema/portion-control-form'

export const useGetPortionControls = () => {
  return useQuery({
    queryKey: ['portion-controls'],
    queryFn: getPortionControls,
  })
}

export const useGetPortionControl = (id: string | null) => {
  return useQuery({
    queryKey: ['portion-control', id],
    queryFn: () => getPortionControl(id!),
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

export const useGetProductVariantOptions = () => {
  return useQuery({
    queryKey: ['product-variant-options'],
    queryFn: getProductVariantOptions,
  })
}

export const useAddPortionControl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addPortionControl,
    onSuccess: () => {
      toast.success('Recipe created successfully')
      queryClient.invalidateQueries({ queryKey: ['portion-controls'] })
      queryClient.invalidateQueries({ queryKey: ['product-variant-options'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recipe')
    },
  })
}

export const useUpdatePortionControl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...portionControl
    }: PortionControlFormValues & { id: string }) =>
      updatePortionControl({ id, ...portionControl }),
    onSuccess: () => {
      toast.success('Recipe updated successfully')
      queryClient.invalidateQueries({ queryKey: ['portion-controls'] })
      queryClient.invalidateQueries({ queryKey: ['portion-control'] })
      queryClient.invalidateQueries({ queryKey: ['product-variant-options'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recipe')
    },
  })
}

export const useDeletePortionControl = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePortionControl,
    onSuccess: () => {
      toast.success('Recipe deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['portion-controls'] })
      queryClient.invalidateQueries({ queryKey: ['product-variant-options'] })
    },
    onError: () => {
      toast.error('Failed to delete recipe')
    },
  })
}

