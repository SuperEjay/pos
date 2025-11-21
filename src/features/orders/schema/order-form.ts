import { z } from 'zod'

/**
 * Zod schema for order item form validation
 */
const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variant_id: z.string().nullable().optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .min(1, 'Quantity must be at least 1'),
  price: z
    .number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
})

/**
 * Zod schema for order form validation
 */
export const orderFormSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name must not exceed 100 characters')
    .trim(),
  status: z.enum(
    ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    {
      message: 'Status is required',
    },
  ),
  order_date: z.string().min(1, 'Order date is required'),
  order_type: z.enum(['pickup', 'delivery']).nullable().optional(),
  delivery_fee: z
    .number()
    .nonnegative('Delivery fee must be non-negative')
    .nullable()
    .optional(),
  payment_method: z.enum(['cash', 'gcash']).nullable().optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .trim()
    .nullable()
    .optional(),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .refine(
      (items) => {
        const productVariantPairs = items.map(
          (item) => `${item.product_id}-${item.variant_id || 'no-variant'}`,
        )
        return new Set(productVariantPairs).size === productVariantPairs.length
      },
      {
        message: 'Duplicate products with the same variant are not allowed',
      },
    ),
})

/**
 * Type inferred from order form schema
 */
export type OrderFormValues = z.infer<typeof orderFormSchema>
export type OrderItemFormValues = z.infer<typeof orderItemSchema>

