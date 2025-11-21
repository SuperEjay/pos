/**
 * Product entity type definition
 */
export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string
  sku: string | null
  price: number | null
  stock: number | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

/**
 * Product variant type definition
 */
export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price: number | null
  stock: number | null
  sku: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Product variant option type definition
 */
export interface ProductVariantOption {
  id: string
  variant_id: string
  name: string
  value: string
  created_at: string
  updated_at: string | null
}

/**
 * Product with variants and category
 */
export interface ProductWithDetails extends Product {
  category_name?: string
  variants_count?: number
}

