import { z } from 'zod'

export const eventCategoryEnum = z.enum(['wedding', 'corporate', 'private'])

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').trim(),
  location: z.string().min(1, 'Location is required').max(300).trim(),
  pax: z.number().int().positive('Pax must be positive'),
  description: z.string().min(1, 'Description is required').trim(),
  images: z
    .array(z.string())
    .transform((arr) => (arr || []).filter((u) => u && u.startsWith('http'))),
  featured_image_index: z.number().int().min(0),
  event_date: z.string().min(1, 'Event date is required'),
  category: eventCategoryEnum,
  flavors: z
    .array(z.string().trim())
    .default([])
    .transform((arr) => (arr || []).filter(Boolean)),
})

export interface EventFormValues {
  title: string
  slug: string
  location: string
  pax: number
  description: string
  images: string[]
  featured_image_index: number
  event_date: string
  category: 'wedding' | 'corporate' | 'private'
  flavors: string[]
}
