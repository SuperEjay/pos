import { toast } from 'sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
  type GetExpensesFilters,
} from '../services/expenses.service'

export const useAddExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      toast.success('Expense added successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => {
      toast.error('Failed to add expense')
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      toast.success('Expense updated successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => {
      toast.error('Failed to update expense')
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success('Expense deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => {
      toast.error('Failed to delete expense')
    },
  })
}

export const useGetExpenses = (filters?: GetExpensesFilters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => getExpenses(filters),
  })
}

export const useGetExpense = (id: string | null) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => getExpense(id!),
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

