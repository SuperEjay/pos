import { z } from 'zod'

/**
 * Zod schema for portion control item form validation
 */
const portionControlItemSchema = z.object({
  ingredient_product_id: z.string().optional().nullable(),
  ingredient_variant_id: z.string().optional().nullable(),
  ingredient_name: z
    .string()
    .min(1, 'Ingredient name is required')
    .max(200, 'Ingredient name must not exceed 200 characters')
    .trim(),
  serving_size: z
    .number()
    .positive('Serving size must be positive')
    .min(0.001, 'Serving size must be at least 0.001'),
  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(20, 'Unit must not exceed 20 characters')
    .trim(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
})

/**
 * Zod schema for portion control form validation
 */
export const portionControlFormSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variant_id: z.string().optional().nullable(),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .trim()
    .optional()
    .nullable(),
  serving_size: z
    .string()
    .max(100, 'Serving size must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  items: z
    .array(portionControlItemSchema)
    .min(1, 'At least one recipe item is required'),
})

/**
 * Type inferred from portion control form schema
 */
export type PortionControlFormValues = z.infer<typeof portionControlFormSchema>
export type PortionControlItemFormValues = z.infer<
  typeof portionControlItemSchema
>

