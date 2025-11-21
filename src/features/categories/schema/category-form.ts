import { z } from 'zod'

/**
 * Zod schema for category form validation
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters'),
})

/**
 * Type inferred from category form schema
 */
export type CategoryFormValues = z.infer<typeof categoryFormSchema>

