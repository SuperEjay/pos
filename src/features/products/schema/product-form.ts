import { z } from 'zod'

/**
 * Zod schema for variant option form validation
 */
const variantOptionSchema = z.object({
  name: z
    .string()
    .min(1, 'Option name is required')
    .max(50, 'Option name must not exceed 50 characters')
    .trim(),
  value: z
    .string()
    .min(1, 'Option value is required')
    .max(100, 'Option value must not exceed 100 characters')
    .trim(),
})

/**
 * Zod schema for product variant form validation
 */
const variantSchema = z.object({
  name: z
    .string()
    .min(1, 'Variant name is required')
    .max(100, 'Variant name must not exceed 100 characters')
    .trim(),
  price: z
    .union([z.number().positive('Price must be positive'), z.null()])
    .optional(),
  stock: z
    .union([z.number().int().min(0, 'Stock must be non-negative'), z.null()])
    .optional(),
  sku: z
    .string()
    .max(50, 'SKU must not exceed 50 characters')
    .trim()
    .optional()
    .nullable(),
  options: z.array(variantOptionSchema),
})

/**
 * Zod schema for product form validation
 */
export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  category_id: z.string().min(1, 'Category is required'),
  sku: z
    .string()
    .max(50, 'SKU must not exceed 50 characters')
    .trim()
    .optional()
    .nullable(),
  price: z
    .union([z.number().positive('Price must be positive'), z.null()])
    .optional(),
  stock: z
    .union([z.number().int().min(0, 'Stock must be non-negative'), z.null()])
    .optional(),
  variants: z.array(variantSchema).min(0),
})

/**
 * Type inferred from product form schema
 */
export type ProductFormValues = z.infer<typeof productFormSchema>
export type VariantFormValues = z.infer<typeof variantSchema>
export type VariantOptionFormValues = z.infer<typeof variantOptionSchema>

