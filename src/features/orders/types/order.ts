/**
 * Order status type
 */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'

/**
 * Order entity type definition
 */
export interface Order {
  id: string
  customer_name: string
  status: OrderStatus
  total: number
  order_date: string
  created_at: string
  updated_at: string | null
}

/**
 * Order item type definition
 */
export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: number
  subtotal: number
  created_at: string
  updated_at: string | null
}

/**
 * Order item with product details
 */
export interface OrderItemWithDetails extends OrderItem {
  product_name?: string
  product_sku?: string | null
  variant_name?: string | null
  variant_sku?: string | null
  category_name?: string | null
}

/**
 * Order with items and details
 */
export interface OrderWithDetails extends Order {
  items?: Array<OrderItemWithDetails>
}
