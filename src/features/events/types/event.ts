/**
 * Event entity (matches Deja Bros website Event shape)
 */
export type EventCategory = 'wedding' | 'corporate' | 'private'

export interface Event {
  id: string
  title: string
  slug: string
  location: string
  pax: number
  description: string
  images: string[]
  featured_image_index: number
  event_date: string
  category: EventCategory
  flavors: string[]
  created_at: string
  updated_at: string | null
}
