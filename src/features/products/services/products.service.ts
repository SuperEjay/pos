import type { ProductFormValues } from '../schema/product-form'
import supabase from '@/utils/supabase'

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(name)
    `,
    )
    .order('name', { ascending: true })
  if (error) throw error

  // Get variant counts for each product
  const productIds = data.map((p: any) => p.id)
  const { data: variantCounts } = await supabase
    .from('product_variants')
    .select('product_id')
    .in('product_id', productIds)

  const countsMap = new Map<string, number>()
  variantCounts?.forEach((v: any) => {
    countsMap.set(v.product_id, (countsMap.get(v.product_id) || 0) + 1)
  })

  return data.map((product: any) => ({
    ...product,
    category_name: product.category?.name || null,
    variants_count: countsMap.get(product.id) || 0,
  }))
}

export const getProduct = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(name),
      variants:product_variants(
        *,
        options:product_variant_options(*)
      )
    `,
    )
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const addProduct = async (product: ProductFormValues) => {
  // Insert product
  const { data: productData, error: productError } = await supabase
    .from('products')
    .insert({
      name: product.name,
      description: product.description || null,
      category_id: product.category_id,
      sku: product.sku || null,
      price: product.price || null,
      stock: product.stock || null,
      is_active: true,
    })
    .select()
    .single()

  if (productError) throw productError

  // Insert variants if any
  if (product.variants && product.variants.length > 0) {
    const variantsToInsert = product.variants.map((variant) => ({
      product_id: productData.id,
      name: variant.name,
      price: variant.price || null,
      stock: variant.stock || null,
      sku: variant.sku || null,
    }))

    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select()

    if (variantsError) throw variantsError

    // Insert variant options if any
    const optionsToInsert: Array<{
      variant_id: string
      name: string
      value: string
    }> = []

    product.variants.forEach((variant, variantIndex) => {
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option) => {
          optionsToInsert.push({
            variant_id: variantsData[variantIndex].id,
            name: option.name,
            value: option.value,
          })
        })
      }
    })

    if (optionsToInsert.length > 0) {
      const { error: optionsError } = await supabase
        .from('product_variant_options')
        .insert(optionsToInsert)

      if (optionsError) throw optionsError
    }
  }

  return productData
}

export const updateProduct = async ({
  id,
  ...product
}: ProductFormValues & { id: string }) => {
  // Update product
  const { data, error } = await supabase
    .from('products')
    .update({
      name: product.name,
      description: product.description || null,
      category_id: product.category_id,
      sku: product.sku || null,
      price: product.price || null,
      stock: product.stock || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Delete existing variants and options
  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id)

  if (existingVariants && existingVariants.length > 0) {
    const variantIds = existingVariants.map((v) => v.id)
    await supabase
      .from('product_variant_options')
      .delete()
      .in('variant_id', variantIds)
    await supabase.from('product_variants').delete().eq('product_id', id)
  }

  // Insert new variants if any
  if (product.variants && product.variants.length > 0) {
    const variantsToInsert = product.variants.map((variant) => ({
      product_id: id,
      name: variant.name,
      price: variant.price || null,
      stock: variant.stock || null,
      sku: variant.sku || null,
    }))

    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert)
      .select()

    if (variantsError) throw variantsError

    // Insert variant options if any
    const optionsToInsert: Array<{
      variant_id: string
      name: string
      value: string
    }> = []

    product.variants.forEach((variant, variantIndex) => {
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option) => {
          optionsToInsert.push({
            variant_id: variantsData[variantIndex].id,
            name: option.name,
            value: option.value,
          })
        })
      }
    })

    if (optionsToInsert.length > 0) {
      const { error: optionsError } = await supabase
        .from('product_variant_options')
        .insert(optionsToInsert)

      if (optionsError) throw optionsError
    }
  }

  return data
}

export const deleteProduct = async (id: string) => {
  // Delete variant options first
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', id)

  if (variants && variants.length > 0) {
    const variantIds = variants.map((v) => v.id)
    await supabase
      .from('product_variant_options')
      .delete()
      .in('variant_id', variantIds)
    await supabase.from('product_variants').delete().eq('product_id', id)
  }

  // Delete product
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export const toggleProductStatus = async (id: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

