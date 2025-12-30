import type { PortionControlFormValues } from '../schema/portion-control-form'
import type {
  PortionControl,
  PortionControlItem,
  PortionControlWithDetails,
  ProductVariantOption,
} from '../types'
import supabase from '@/utils/supabase'

/**
 * Get all products with their variants for recipe selection
 */
export const getProductVariantOptions = async (): Promise<
  Array<ProductVariantOption>
> => {
  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (productsError) throw productsError

  // Get all variants
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, product_id, name')
    .order('name', { ascending: true })

  if (variantsError) throw variantsError

  // Build options array
  const options: Array<ProductVariantOption> = []

  products?.forEach((product) => {
    const productVariants = variants?.filter(
      (v) => v.product_id === product.id,
    ) || []

    // Add base product option (no variant)
    options.push({
      id: `product-${product.id}`,
      name: product.name,
      product_id: product.id,
      product_name: product.name,
      variant_id: null,
      has_variants: productVariants.length > 0,
    })

    // Add variant options
    productVariants.forEach((variant) => {
      options.push({
        id: `variant-${variant.id}`,
        name: `${product.name} - ${variant.name}`,
        product_id: product.id,
        product_name: product.name,
        variant_id: variant.id,
        has_variants: true,
      })
    })
  })

  return options
}

/**
 * Check if a recipe already exists for a product/variant combination
 */
export const checkRecipeExists = async (
  productId: string,
  variantId: string | null,
): Promise<boolean> => {
  let query = supabase
    .from('portion_controls')
    .select('id')
    .eq('product_id', productId)

  if (variantId) {
    query = query.eq('variant_id', variantId)
  } else {
    query = query.is('variant_id', null)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected if recipe doesn't exist
    throw error
  }

  return !!data
}

/**
 * Get all portion controls with details
 */
export const getPortionControls = async (): Promise<
  Array<PortionControlWithDetails>
> => {
  const { data, error } = await supabase
    .from('portion_controls')
    .select(
      `
      *,
      product:products(name),
      variant:product_variants(name)
    `,
    )
    .order('name', { ascending: true })

  if (error) throw error

  // Get item counts for each portion control
  const portionControlIds = data.map((pc: any) => pc.id)
  const { data: itemCounts } = await supabase
    .from('portion_control_items')
    .select('portion_control_id')
    .in('portion_control_id', portionControlIds)

  const countsMap = new Map<string, number>()
  itemCounts?.forEach((item: any) => {
    countsMap.set(
      item.portion_control_id,
      (countsMap.get(item.portion_control_id) || 0) + 1,
    )
  })

  return data.map((pc: any) => ({
    id: pc.id,
    product_id: pc.product_id,
    variant_id: pc.variant_id,
    name: pc.name,
    description: pc.description,
    serving_size: pc.serving_size,
    created_at: pc.created_at,
    updated_at: pc.updated_at,
    product_name: pc.product?.name || null,
    variant_name: pc.variant?.name || null,
    items_count: countsMap.get(pc.id) || 0,
  }))
}

/**
 * Get a single portion control with items
 */
export const getPortionControl = async (
  id: string,
): Promise<PortionControlWithDetails> => {
  const { data, error } = await supabase
    .from('portion_controls')
    .select(
      `
      *,
      product:products(name),
      variant:product_variants(name),
      items:portion_control_items(
        *,
        ingredient_product:products(name),
        ingredient_variant:product_variants(name)
      )
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    product_id: data.product_id,
    variant_id: data.variant_id,
    name: data.name,
    description: data.description,
    serving_size: data.serving_size,
    created_at: data.created_at,
    updated_at: data.updated_at,
    product_name: data.product?.name || null,
    variant_name: data.variant?.name || null,
    items: (data.items || []).map((item: any) => ({
      id: item.id,
      portion_control_id: item.portion_control_id,
      ingredient_product_id: item.ingredient_product_id,
      ingredient_variant_id: item.ingredient_variant_id,
      ingredient_name: item.ingredient_name,
      quantity: Number(item.quantity),
      unit: item.unit,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
    items_count: data.items?.length || 0,
  }
}

/**
 * Add a new portion control
 */
export const addPortionControl = async (
  portionControl: PortionControlFormValues,
): Promise<PortionControlWithDetails> => {
  // Check if recipe already exists
  const exists = await checkRecipeExists(
    portionControl.product_id,
    portionControl.variant_id || null,
  )

  if (exists) {
    const productName = portionControl.variant_id
      ? 'this product variant'
      : 'this product'
    throw new Error(
      `A recipe already exists for ${productName}. Please update the existing recipe or choose a different product/variant.`,
    )
  }

  // Insert portion control
  const { data: portionControlData, error: portionControlError } =
    await supabase
      .from('portion_controls')
      .insert({
        product_id: portionControl.product_id,
        variant_id: portionControl.variant_id || null,
        name: portionControl.name,
        description: portionControl.description || null,
        serving_size: portionControl.serving_size || null,
      })
      .select()
      .single()

  if (portionControlError) {
    // Handle unique constraint violation
    if (portionControlError.code === '23505') {
      const productName = portionControl.variant_id
        ? 'this product variant'
        : 'this product'
      throw new Error(
        `A recipe already exists for ${productName}. Please update the existing recipe or choose a different product/variant.`,
      )
    }
    throw portionControlError
  }

  // Insert portion control items
  if (portionControl.items && portionControl.items.length > 0) {
    const itemsToInsert = portionControl.items.map((item) => ({
      portion_control_id: portionControlData.id,
      ingredient_product_id: item.ingredient_product_id || null,
      ingredient_variant_id: item.ingredient_variant_id || null,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes || null,
    }))

    const { error: itemsError } = await supabase
      .from('portion_control_items')
      .insert(itemsToInsert)

    if (itemsError) {
      // If items fail to insert, delete the portion control to maintain consistency
      await supabase
        .from('portion_controls')
        .delete()
        .eq('id', portionControlData.id)
      throw itemsError
    }
  }

  // Fetch the complete portion control with items
  return getPortionControl(portionControlData.id)
}

/**
 * Update a portion control
 */
export const updatePortionControl = async ({
  id,
  ...portionControl
}: PortionControlFormValues & { id: string }): Promise<PortionControlWithDetails> => {
  // Check if recipe already exists for a different portion control
  const existing = await getPortionControl(id)
  const isChangingProductOrVariant =
    existing.product_id !== portionControl.product_id ||
    existing.variant_id !== (portionControl.variant_id || null)

  if (isChangingProductOrVariant) {
    const exists = await checkRecipeExists(
      portionControl.product_id,
      portionControl.variant_id || null,
    )

    if (exists) {
      const productName = portionControl.variant_id
        ? 'this product variant'
        : 'this product'
      throw new Error(
        `A recipe already exists for ${productName}. Please choose a different product/variant.`,
      )
    }
  }

  // Delete existing items first
  const { error: deleteError } = await supabase
    .from('portion_control_items')
    .delete()
    .eq('portion_control_id', id)

  if (deleteError) throw deleteError

  // Update portion control
  const { error: portionControlError } = await supabase
    .from('portion_controls')
    .update({
      product_id: portionControl.product_id,
      variant_id: portionControl.variant_id || null,
      name: portionControl.name,
      description: portionControl.description || null,
      serving_size: portionControl.serving_size || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (portionControlError) {
    // Handle unique constraint violation
    if (portionControlError.code === '23505') {
      const productName = portionControl.variant_id
        ? 'this product variant'
        : 'this product'
      throw new Error(
        `A recipe already exists for ${productName}. Please choose a different product/variant.`,
      )
    }
    throw portionControlError
  }

  // Insert new items
  if (portionControl.items && portionControl.items.length > 0) {
    const itemsToInsert = portionControl.items.map((item) => ({
      portion_control_id: id,
      ingredient_product_id: item.ingredient_product_id || null,
      ingredient_variant_id: item.ingredient_variant_id || null,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes || null,
    }))

    const { error: itemsError } = await supabase
      .from('portion_control_items')
      .insert(itemsToInsert)

    if (itemsError) throw itemsError
  }

  // Fetch the complete portion control with items
  return getPortionControl(id)
}

/**
 * Delete a portion control
 */
export const deletePortionControl = async (id: string): Promise<void> => {
  // Delete portion control (items will be deleted automatically due to CASCADE)
  const { error } = await supabase
    .from('portion_controls')
    .delete()
    .eq('id', id)
  if (error) throw error
}

