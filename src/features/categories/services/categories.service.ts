import type { CategoryFormValues } from '../schema/category-form'
import supabase from '@/utils/supabase'

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export const addCategory = async (category: CategoryFormValues) => {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      description: category.description || null,
      is_active: true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateCategory = async ({
  id,
  ...category
}: CategoryFormValues & { id: string }) => {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: category.name,
      description: category.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export const toggleCategoryStatus = async (id: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('categories')
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
