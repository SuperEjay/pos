import { useCallback, useMemo, useState } from 'react'

import { useDeleteExpense, useGetExpenses } from '../hooks'
import { ExpensesTable } from './expenses-table'
import type { ExpenseTableRow } from './expenses-table'
import type { GetExpensesFilters } from '../services/expenses.service'

import { Header } from '@/components'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate } from '@tanstack/react-router'

export default function Expenses() {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [filters, setFilters] = useState<GetExpensesFilters>({})

  const { data: expenses, isLoading } = useGetExpenses(filters)
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense()

  // Map the expenses to the ExpenseTableRow type
  const mappedExpenses: Array<ExpenseTableRow> = useMemo(
    () =>
      expenses?.map((expense: any) => ({
        id: expense.id,
        transaction_date: expense.transaction_date,
        total_expense: expense.total_expense,
        items_count: expense.items_count,
        remarks: expense.remarks || null,
        created_at: expense.created_at,
        updated_at: expense.updated_at || expense.created_at,
      })) ?? [],
    [expenses],
  )

  // Calculate total overall expenses
  const totalOverallExpenses = useMemo(() => {
    return mappedExpenses.reduce(
      (sum, expense) => sum + Number(expense.total_expense || 0),
      0,
    )
  }, [mappedExpenses])

  // Format number in accounting format
  const formatAccounting = useCallback((num: number): string => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  const handleCreate = useCallback(() => {
    navigate({ to: '/expenses/new' })
  }, [navigate])

  const handleEdit = useCallback(
    (expense: ExpenseTableRow) => {
      navigate({ to: '/expenses/$expenseId', params: { expenseId: expense.id } })
    },
    [navigate],
  )

  const handleDeleteClick = useCallback((expenseId: string) => {
    setExpenseToDelete(expenseId)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete)
      setExpenseToDelete(null)
    }
  }, [expenseToDelete, deleteExpense])

  return (
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="Expenses"
          description="Manage your expenses here. You can add, edit, view, and delete expenses."
        />

        {/* Total Overall Expenses Widget */}
        <div className="p-6 border border-stone-200 rounded-lg bg-gradient-to-r from-stone-50 to-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-stone-600 mb-1">
                Total Overall Expenses
              </h3>
              <p className="text-3xl font-bold text-stone-900">
                ₱{formatAccounting(totalOverallExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading expenses...
            </div>
          ) : (
            <ExpensesTable
              data={mappedExpenses}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onAddExpense={handleCreate}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}

