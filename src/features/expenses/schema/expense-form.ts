import { z } from 'zod'

/**
 * Zod schema for expense item form validation
 */
const expenseItemSchema = z.object({
  item_name: z
    .string()
    .min(1, 'Item name is required')
    .max(200, 'Item name must not exceed 200 characters')
    .trim(),
  cost: z
    .number()
    .positive('Cost must be positive')
    .min(0.01, 'Cost must be at least 0.01'),
})

/**
 * Zod schema for expense form validation
 */
export const expenseFormSchema = z.object({
  transaction_date: z.string().min(1, 'Transaction date is required'),
  items: z
    .array(expenseItemSchema)
    .min(1, 'At least one expense item is required'),
  remarks: z
    .string()
    .max(1000, 'Remarks must not exceed 1000 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * Type inferred from expense form schema
 */
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
export type ExpenseItemFormValues = z.infer<typeof expenseItemSchema>

