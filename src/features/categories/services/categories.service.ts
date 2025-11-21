import type { CategoryFormValues } from '../schema/category-form'
import supabase from '@/utils/supabase'

export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*')
  if (error) throw error
  return data
}

export const addCategory = async (category: CategoryFormValues) => {
  const { data, error } = await supabase.from('categories').insert(category)
  if (error) throw error
  return data
}
