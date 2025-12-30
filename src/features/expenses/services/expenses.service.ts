import type { ExpenseFormValues } from '../schema/expense-form'
import type { ExpenseWithItems } from '../types'
import supabase from '@/utils/supabase'

export interface GetExpensesFilters {
  date_from?: string
  date_to?: string
}

export const getExpenses = async (
  filters?: GetExpensesFilters,
): Promise<Array<ExpenseWithItems>> => {
  let query = supabase
    .from('expenses')
    .select(
      `
      *,
      items:expense_items(*)
    `,
    )
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Apply date filters
  if (filters?.date_from) {
    query = query.gte('transaction_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('transaction_date', filters.date_to)
  }

  const { data, error } = await query

  if (error) throw error

  return (
    data?.map((expense: any) => ({
      id: expense.id,
      transaction_date: expense.transaction_date,
      total_expense: Number(expense.total_expense),
      items_count: expense.items_count,
      remarks: expense.remarks || null,
      created_at: expense.created_at,
      updated_at: expense.updated_at || null,
      items:
        expense.items?.map((item: any) => ({
          id: item.id,
          expense_id: item.expense_id,
          item_name: item.item_name,
          cost: Number(item.cost),
          created_at: item.created_at,
          updated_at: item.updated_at || null,
        })) || [],
    })) || []
  )
}

export const getExpense = async (id: string): Promise<ExpenseWithItems> => {
  const { data, error } = await supabase
    .from('expenses')
    .select(
      `
      *,
      items:expense_items(*)
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    transaction_date: data.transaction_date,
    total_expense: Number(data.total_expense),
    items_count: data.items_count,
    remarks: data.remarks || null,
    created_at: data.created_at,
    updated_at: data.updated_at || null,
    items: (data.items || []).map((item: any) => ({
      id: item.id,
      expense_id: item.expense_id,
      item_name: item.item_name,
      cost: Number(item.cost),
      created_at: item.created_at,
      updated_at: item.updated_at || null,
    })),
  }
}

export const addExpense = async (
  expense: ExpenseFormValues,
): Promise<ExpenseWithItems> => {
  // Validate that there's at least one item
  if (!expense.items || expense.items.length === 0) {
    throw new Error('At least one expense item is required')
  }

  // Check if transaction date already exists
  const { data: existingExpense, error: checkError } = await supabase
    .from('expenses')
    .select('id')
    .eq('transaction_date', expense.transaction_date)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected if date doesn't exist
    throw checkError
  }

  if (existingExpense) {
    throw new Error(
      `An expense for the date ${expense.transaction_date} already exists. Please use a different date or update the existing expense.`,
    )
  }

  const totalExpense = expense.items.reduce((sum, item) => sum + item.cost, 0)

  // Insert expense
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      transaction_date: expense.transaction_date,
      total_expense: totalExpense,
      items_count: expense.items.length,
      remarks: expense.remarks || null,
    })
    .select()
    .single()

  if (expenseError) {
    // Handle unique constraint violation
    if (expenseError.code === '23505') {
      throw new Error(
        `An expense for the date ${expense.transaction_date} already exists. Please use a different date or update the existing expense.`,
      )
    }
    throw expenseError
  }

  // Insert expense items (should always have items due to validation above)
  const itemsToInsert = expense.items.map((item) => ({
    expense_id: expenseData.id,
    item_name: item.item_name,
    cost: item.cost,
  }))

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // If items fail to insert, delete the expense to maintain consistency
    await supabase.from('expenses').delete().eq('id', expenseData.id)
    throw itemsError
  }

  // Fetch the complete expense with items
  return getExpense(expenseData.id)
}

export const updateExpense = async ({
  id,
  ...expense
}: ExpenseFormValues & { id: string }): Promise<ExpenseWithItems> => {
  // Validate that there's at least one item
  if (!expense.items || expense.items.length === 0) {
    throw new Error('At least one expense item is required')
  }

  // Check if transaction date already exists for a different expense
  const { data: existingExpense, error: checkError } = await supabase
    .from('expenses')
    .select('id')
    .eq('transaction_date', expense.transaction_date)
    .neq('id', id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected if date doesn't exist
    throw checkError
  }

  if (existingExpense) {
    throw new Error(
      `An expense for the date ${expense.transaction_date} already exists. Please use a different date or update the existing expense.`,
    )
  }

  const totalExpense = expense.items.reduce((sum, item) => sum + item.cost, 0)

  // Delete existing items first
  const { error: deleteError } = await supabase
    .from('expense_items')
    .delete()
    .eq('expense_id', id)

  if (deleteError) throw deleteError

  // Insert new items
  const itemsToInsert = expense.items.map((item) => ({
    expense_id: id,
    item_name: item.item_name,
    cost: item.cost,
  }))

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  // Update expense (database trigger will also update totals, but we set them explicitly)
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      transaction_date: expense.transaction_date,
      total_expense: totalExpense,
      items_count: expense.items.length,
      remarks: expense.remarks || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (expenseError) {
    // Handle unique constraint violation
    if (expenseError.code === '23505') {
      throw new Error(
        `An expense for the date ${expense.transaction_date} already exists. Please use a different date or update the existing expense.`,
      )
    }
    throw expenseError
  }

  // Fetch the complete expense with items
  return getExpense(id)
}

export const deleteExpense = async (id: string): Promise<void> => {
  // Delete expense (items will be deleted automatically due to CASCADE)
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
