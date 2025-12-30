import type { ExpenseFormValues } from '../schema/expense-form'
import type { ExpenseWithItems } from '../types'

const STORAGE_KEY = 'expenses_data'

// Helper functions for localStorage
const getExpensesFromStorage = (): Array<ExpenseWithItems> => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveExpensesToStorage = (expenses: Array<ExpenseWithItems>) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

export interface GetExpensesFilters {
  date_from?: string
  date_to?: string
}

export const getExpenses = async (
  filters?: GetExpensesFilters,
): Promise<Array<ExpenseWithItems>> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  let expenses = getExpensesFromStorage()

  // Apply date filters
  if (filters?.date_from) {
    expenses = expenses.filter(
      (expense) => expense.transaction_date >= filters.date_from!,
    )
  }
  if (filters?.date_to) {
    expenses = expenses.filter(
      (expense) => expense.transaction_date <= filters.date_to!,
    )
  }

  // Sort by transaction date descending
  return expenses.sort(
    (a, b) =>
      new Date(b.transaction_date).getTime() -
      new Date(a.transaction_date).getTime(),
  )
}

export const getExpense = async (id: string): Promise<ExpenseWithItems> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  const expenses = getExpensesFromStorage()
  const expense = expenses.find((e) => e.id === id)

  if (!expense) {
    throw new Error('Expense not found')
  }

  return expense
}

export const addExpense = async (
  expense: ExpenseFormValues,
): Promise<ExpenseWithItems> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const expenses = getExpensesFromStorage()

  const totalExpense = expense.items.reduce((sum, item) => sum + item.cost, 0)

  const newExpense: ExpenseWithItems = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transaction_date: expense.transaction_date,
    total_expense: totalExpense,
    items_count: expense.items.length,
    remarks: expense.remarks || null,
    created_at: new Date().toISOString(),
    updated_at: null,
    items: expense.items.map((item, index) => ({
      id: `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      expense_id: '',
      item_name: item.item_name,
      cost: item.cost,
      created_at: new Date().toISOString(),
      updated_at: null,
    })),
  }

  // Update expense_id for items
  if (newExpense.items) {
    newExpense.items = newExpense.items.map((item) => ({
      ...item,
      expense_id: newExpense.id,
    }))
  }

  expenses.push(newExpense)
  saveExpensesToStorage(expenses)

  return newExpense
}

export const updateExpense = async ({
  id,
  ...expense
}: ExpenseFormValues & { id: string }): Promise<ExpenseWithItems> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const expenses = getExpensesFromStorage()
  const index = expenses.findIndex((e) => e.id === id)

  if (index === -1) {
    throw new Error('Expense not found')
  }

  const totalExpense = expense.items.reduce((sum, item) => sum + item.cost, 0)

  const updatedExpense: ExpenseWithItems = {
    ...expenses[index],
    transaction_date: expense.transaction_date,
    total_expense: totalExpense,
    items_count: expense.items.length,
    remarks: expense.remarks || null,
    updated_at: new Date().toISOString(),
    items: expense.items.map((item, idx) => ({
      id:
        expenses[index].items?.[idx]?.id ||
        `item_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      expense_id: id,
      item_name: item.item_name,
      cost: item.cost,
      created_at:
        expenses[index].items?.[idx]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  }

  expenses[index] = updatedExpense
  saveExpensesToStorage(expenses)

  return updatedExpense
}

export const deleteExpense = async (id: string): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const expenses = getExpensesFromStorage()
  const filtered = expenses.filter((e) => e.id !== id)
  saveExpensesToStorage(filtered)
}
