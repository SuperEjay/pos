/**
 * Portion Control (Recipe) entity type definition
 */
export interface PortionControl {
  id: string
  product_id: string
  variant_id: string | null
  name: string
  description: string | null
  serving_size: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Portion Control Item (Recipe Ingredient) type definition
 */
export interface PortionControlItem {
  id: string
  portion_control_id: string
  ingredient_product_id: string | null
  ingredient_variant_id: string | null
  ingredient_name: string
  quantity: number
  unit: string
  notes: string | null
  created_at: string
  updated_at: string | null
}

/**
 * Portion Control with items and product details
 */
export interface PortionControlWithDetails extends PortionControl {
  product_name?: string
  variant_name?: string | null
  items?: Array<PortionControlItem>
  items_count?: number
}

/**
 * Product/Variant selection for recipe creation
 */
export interface ProductVariantOption {
  id: string
  name: string
  product_id: string
  product_name: string
  variant_id: string | null
  has_variants: boolean
}

