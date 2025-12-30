import { useEffect, useCallback, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAddExpense, useGetExpense, useUpdateExpense } from '../hooks'
import { expenseFormSchema } from '../schema/expense-form'
import type { ExpenseFormValues } from '../schema/expense-form'
import type { Expense, ExpenseWithItems } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ExpenseFormProps {
  expense?: Expense | ExpenseWithItems | null
}

export function ExpenseForm({ expense: expenseProp }: ExpenseFormProps) {
  const navigate = useNavigate()
  const isEditing = Boolean(expenseProp)
  const { data: fetchedExpense, isLoading: isLoadingExpense } =
    useGetExpense(expenseProp?.id || null)
  
  // Use passed expense if available, otherwise use fetched expense
  const expense = expenseProp || fetchedExpense || null
  const expenseWithItems = expenseProp && 'items' in expenseProp 
    ? expenseProp 
    : fetchedExpense || null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    control,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      items: [{ item_name: '', cost: 0 }],
      remarks: null,
    },
  })

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'items',
  })

  // Reset form when expense changes
  useEffect(() => {
    if (expense && expenseWithItems && !isLoadingExpense) {
      reset({
        transaction_date: expense.transaction_date.split('T')[0],
        items:
          expenseWithItems.items?.map((item) => ({
            item_name: item.item_name,
            cost: item.cost,
          })) || [{ item_name: '', cost: 0 }],
        remarks: expense.remarks || null,
      })
    } else if (!expense) {
      reset({
        transaction_date: new Date().toISOString().split('T')[0],
        items: [{ item_name: '', cost: 0 }],
        remarks: null,
      })
    }
  }, [expense, expenseWithItems, isLoadingExpense, reset])

  const { mutate: addExpense, isPending: isAdding } = useAddExpense()
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense()
  const isPending = isAdding || isUpdating

  // Watch items to calculate total
  const watchedItems = watch('items')
  const grandTotal = useMemo(() => {
    return watchedItems.reduce(
      (sum, item) => sum + (item.cost || 0),
      0,
    )
  }, [watchedItems])

  const onSubmit = (data: ExpenseFormValues) => {
    if (isEditing && expense) {
      updateExpense(
        { id: expense.id, ...data },
        {
          onSuccess: () => {
            navigate({ to: '/expenses' })
          },
        },
      )
    } else {
      addExpense(data, {
        onSuccess: () => {
          navigate({ to: '/expenses' })
        },
      })
    }
  }

  const addItem = useCallback(() => {
    appendItem({
      item_name: '',
      cost: 0,
    })
  }, [appendItem])

  const formatAccounting = useCallback((num: number): string => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  if (isLoadingExpense && expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading expense...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/expenses' })}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Expenses
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Expense' : 'New Expense'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Update the expense information below.'
            : 'Add a new expense. Fill in the details below.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          {/* Transaction Date */}
          <div className="grid gap-2">
            <Label htmlFor="transaction_date">
              Transaction Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transaction_date"
              type="date"
              {...register('transaction_date')}
              disabled={isSubmitting}
              className={cn(
                'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200',
                errors.transaction_date &&
                  'border-destructive focus-visible:border-destructive',
              )}
            />
            {errors.transaction_date && (
              <p className="text-sm text-destructive">
                {errors.transaction_date.message}
              </p>
            )}
          </div>

          {/* Total Expense (Disabled) */}
          <div className="grid gap-2">
            <Label htmlFor="total_expense">Total Expense</Label>
            <Input
              id="total_expense"
              type="text"
              value={`₱${formatAccounting(grandTotal)}`}
              disabled
              className="bg-stone-100 border-stone-300 text-stone-700 font-semibold"
            />
          </div>

          {/* Items Table */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Expense Items <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isSubmitting}
                className="border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Item Name</TableHead>
                    <TableHead className="w-[30%]">Cost</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemFields.map((item, itemIndex) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          {...register(
                            `items.${itemIndex}.item_name` as const,
                          )}
                          placeholder="Enter item name"
                          disabled={isSubmitting}
                          className={cn(
                            'bg-white border-stone-300',
                            errors.items?.[itemIndex]?.item_name &&
                              'border-destructive',
                          )}
                        />
                        {errors.items?.[itemIndex]?.item_name && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.items[itemIndex]?.item_name?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...register(
                            `items.${itemIndex}.cost` as const,
                            { valueAsNumber: true },
                          )}
                          placeholder="0.00"
                          disabled={isSubmitting}
                          className={cn(
                            'bg-white border-stone-300',
                            errors.items?.[itemIndex]?.cost &&
                              'border-destructive',
                          )}
                        />
                        {errors.items?.[itemIndex]?.cost && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.items[itemIndex]?.cost?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {itemFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(itemIndex)}
                            disabled={isSubmitting}
                            className="text-destructive hover:text-destructive"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold">
                      Grand Total:
                    </TableCell>
                    <TableCell className="font-bold">
                      ₱{formatAccounting(grandTotal)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            {errors.items && (
              <p className="text-sm text-destructive">
                {errors.items.message}
              </p>
            )}
          </div>

          {/* Remarks */}
          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              {...register('remarks')}
              placeholder="Enter any additional comments..."
              rows={4}
              disabled={isSubmitting}
              className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
            />
            {errors.remarks && (
              <p className="text-sm text-destructive">
                {errors.remarks.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-stone-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/expenses' })}
            disabled={isPending}
            className="border-stone-300 text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-stone-700 text-white hover:bg-stone-800"
          >
            {isPending
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Expense'
                : 'Create Expense'}
          </Button>
        </div>
      </form>
    </div>
  )
}

