import type { Event } from '../types'
import type { EventFormValues } from '../schema/event-form'
import supabase from '@/utils/supabase'

export const getEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location,
    pax: row.pax,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    featured_image_index: typeof row.featured_image_index === 'number' ? row.featured_image_index : 0,
    event_date: row.event_date,
    category: row.category,
    flavors: Array.isArray(row.flavors) ? row.flavors : [],
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  }))
}

export const getEvent = async (id: string): Promise<Event> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    location: data.location,
    pax: data.pax,
    description: data.description,
    images: Array.isArray(data.images) ? data.images : [],
    featured_image_index: typeof data.featured_image_index === 'number' ? data.featured_image_index : 0,
    event_date: data.event_date,
    category: data.category,
    flavors: Array.isArray(data.flavors) ? data.flavors : [],
    created_at: data.created_at,
    updated_at: data.updated_at ?? null,
  }
}

export const getEventBySlug = async (slug: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    location: data.location,
    pax: data.pax,
    description: data.description,
    images: Array.isArray(data.images) ? data.images : [],
    featured_image_index: typeof data.featured_image_index === 'number' ? data.featured_image_index : 0,
    event_date: data.event_date,
    category: data.category,
    flavors: Array.isArray(data.flavors) ? data.flavors : [],
    created_at: data.created_at,
    updated_at: data.updated_at ?? null,
  }
}

export const addEvent = async (values: EventFormValues): Promise<Event> => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: values.title,
      slug: values.slug,
      location: values.location,
      pax: values.pax,
      description: values.description,
      images: values.images,
      featured_image_index: values.featured_image_index ?? 0,
      event_date: values.event_date,
      category: values.category,
      flavors: values.flavors,
    })
    .select()
    .single()

  if (error) throw error
  return getEvent(data.id)
}

export const updateEvent = async (
  id: string,
  values: EventFormValues,
): Promise<Event> => {
  const { error } = await supabase
    .from('events')
    .update({
      title: values.title,
      slug: values.slug,
      location: values.location,
      pax: values.pax,
      description: values.description,
      images: values.images,
      featured_image_index: values.featured_image_index ?? 0,
      event_date: values.event_date,
      category: values.category,
      flavors: values.flavors,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
  return getEvent(id)
}

export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
