import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import {
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  XIcon,
  PlusIcon,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Expense } from '@/features/expenses/types'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GetExpensesFilters } from '../services/expenses.service'

export type ExpenseTableRow = Expense

interface ExpensesTableProps {
  data: Array<ExpenseTableRow>
  onEdit: (expense: ExpenseTableRow) => void
  onDelete: (expenseId: string) => void
  onAddExpense?: () => void
  filters: GetExpensesFilters
  onFiltersChange: (filters: GetExpensesFilters) => void
}

export const ExpensesTable = memo(function ExpensesTable({
  data,
  onEdit,
  onDelete,
  onAddExpense,
  filters,
  onFiltersChange,
}: ExpensesTableProps) {
  // Local state for filter inputs
  const [localFilters, setLocalFilters] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  })

  // Sync local state with filters when filters change externally
  useEffect(() => {
    setLocalFilters({
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
    })
  }, [filters])

  const handleEdit = useCallback(
    (expense: ExpenseTableRow) => {
      onEdit(expense)
    },
    [onEdit],
  )

  const handleDelete = useCallback(
    (expenseId: string) => {
      onDelete(expenseId)
    },
    [onDelete],
  )

  // Format number in accounting format (comma-separated thousands)
  const formatAccounting = useCallback((num: number): string => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  // Apply filters when button is clicked
  const handleApplyFilters = useCallback(() => {
    // Validate dates before applying
    const isValidDate = (date: string) => {
      if (!date) return true
      if (date.length !== 10) return false
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
      const parsed = new Date(date)
      if (isNaN(parsed.getTime())) return false
      const [year, month, day] = date.split('-').map(Number)
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
      )
    }

    // Only apply if dates are valid
    if (localFilters.date_from && !isValidDate(localFilters.date_from)) {
      return // Don't apply if date_from is invalid
    }
    if (localFilters.date_to && !isValidDate(localFilters.date_to)) {
      return // Don't apply if date_to is invalid
    }

    onFiltersChange({
      date_from: localFilters.date_from || undefined,
      date_to: localFilters.date_to || undefined,
    })
  }, [localFilters, onFiltersChange])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      date_from: '',
      date_to: '',
    })
    onFiltersChange({})
  }, [onFiltersChange])

  const columns: Array<ColumnDef<ExpenseTableRow>> = useMemo(
    () => [
      {
        accessorKey: 'transaction_date',
        header: 'Expense Date',
        cell: ({ row }) => {
          const date = row.getValue('transaction_date')
          return (
            <div>{new Date(date as string).toLocaleDateString()}</div>
          )
        },
      },
      {
        accessorKey: 'total_expense',
        header: 'Total Expense',
        cell: ({ row }) => {
          const total = row.getValue('total_expense')
          return <div>₱{formatAccounting(Number(total))}</div>
        },
      },
      {
        accessorKey: 'items_count',
        header: 'No of Items',
        cell: ({ row }) => {
          const count = row.getValue('items_count') as number
          return <div>{count}</div>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const expense = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(expense)
                  }}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(expense.id)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleEdit, handleDelete, formatAccounting],
  )

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4 p-4 border border-stone-200 rounded-lg bg-stone-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="date-from">Date From</Label>
            <Input
              id="date-from"
              type="date"
              value={localFilters.date_from}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, date_from: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date-to">Date To</Label>
            <Input
              id="date-to"
              type="date"
              value={localFilters.date_to}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, date_to: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <div>
            {onAddExpense && (
              <Button
                size="sm"
                onClick={onAddExpense}
                className="bg-stone-700 text-white hover:bg-stone-800"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="bg-stone-700 text-white hover:bg-stone-800"
            >
              <SearchIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
})

