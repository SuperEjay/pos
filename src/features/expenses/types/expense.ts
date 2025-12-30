/**
 * Expense entity type definition
 */
export interface Expense {
  id: string
  transaction_date: string
  total_expense: number
  items_count: number
  remarks: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Expense item type definition
 */
export interface ExpenseItem {
  id: string
  expense_id: string
  item_name: string
  cost: number
  created_at: string
  updated_at: string | null
}

/**
 * Expense with items
 */
export interface ExpenseWithItems extends Expense {
  items?: Array<ExpenseItem>
}

