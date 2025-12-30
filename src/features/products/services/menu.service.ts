import supabase from '@/utils/supabase'

export interface MenuProductVariant {
  id: string
  name: string
  price: number | null
}

export interface MenuProduct {
  id: string
  name: string
  description: string | null
  category_id: string
  category_name: string
  price: number | null
  variants: Array<MenuProductVariant>
}

export interface MenuCategory {
  id: string
  name: string
  products: Array<MenuProduct>
}

export const getMenuProducts = async (): Promise<Array<MenuCategory>> => {
  // Fetch all active products with their variants and categories
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      description,
      category_id,
      price,
      category:categories(id, name),
      variants:product_variants(
        id,
        name,
        price
      )
    `,
    )
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error

  // Group products by category
  const categoryMap = new Map<string, MenuCategory>()

  data?.forEach((product: any) => {
    const categoryId = product.category_id
    const categoryName = product.category?.name || 'Uncategorized'

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        products: [],
      })
    }

    const category = categoryMap.get(categoryId)!
    category.products.push({
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: categoryId,
      category_name: categoryName,
      price: product.price,
      variants: (product.variants || []).map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
      })),
    })
  })

  // Convert map to array and sort categories by name
  const sortedCategories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  // Set first category as default selected
  return sortedCategories
}

