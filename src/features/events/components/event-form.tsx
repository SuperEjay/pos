import { useEffect, useCallback, useRef, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, PlusIcon, Star, TrashIcon, Upload } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAddEvent, useGetEvent, useUpdateEvent } from '../hooks'
import { eventFormSchema } from '../schema/event-form'
import type { EventFormValues } from '../schema/event-form'
import type { Event } from '../types'
import { uploadEventImage, isStorageConfigured } from '../services/events-storage.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const ALBUM_THUMB_CLASS =
  'relative aspect-square w-full min-w-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm transition-shadow hover:shadow-md'

function PendingImageThumb({
  file,
  isFeatured,
  onSetFeatured,
  onRemove,
  canRemove,
}: {
  file: File
  isFeatured: boolean
  onSetFeatured: () => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div
      className={cn(
        ALBUM_THUMB_CLASS,
        'border-dashed border-muted-foreground/40',
        isFeatured && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {objectUrl ? (
        <img src={objectUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">Preview…</div>
      )}
      <Button
        type="button"
        variant={isFeatured ? 'default' : 'secondary'}
        size="icon"
        className="absolute left-1.5 top-1.5 h-7 w-7 shadow"
        onClick={onSetFeatured}
        title={isFeatured ? 'Featured image' : 'Set as featured image'}
      >
        <Star className={cn('h-3.5 w-3.5', isFeatured && 'fill-current')} />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1.5 top-1.5 h-7 w-7 shadow"
        onClick={onRemove}
        disabled={!canRemove}
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

interface EventFormProps {
  event?: Event | null
}

export function EventForm({ event: eventProp }: EventFormProps) {
  const navigate = useNavigate()
  const isEditing = Boolean(eventProp?.id)
  const eventId = eventProp?.id ?? null
  const { data: fetchedEvent, isLoading } = useGetEvent(eventId)

  const event = eventProp ?? fetchedEvent ?? null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
    getValues,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      location: '',
      pax: 50,
      description: '',
      images: [''],
      featured_image_index: 0,
      event_date: new Date().toISOString().slice(0, 10),
      category: 'wedding',
      flavors: [''],
    },
  })

  const title = watch('title')
  const slug = watch('slug')
  const userHasEditedSlugRef = useRef(false)

  // Auto-suggest slug from title when the user hasn't customized the slug
  useEffect(() => {
    if (userHasEditedSlugRef.current || !title?.trim()) return
    setValue('slug', slugify(title))
  }, [title, setValue])

  // When loading an existing event, treat its slug as user-set so we don't overwrite on title change
  useEffect(() => {
    if (event?.slug) userHasEditedSlugRef.current = true
  }, [event?.slug])

  // When creating a new event, allow auto-suggest again
  useEffect(() => {
    if (!event && !isLoading) userHasEditedSlugRef.current = false
  }, [event, isLoading])

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images',
  })
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleAttachImages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const files = input.files
    if (!files?.length) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) {
      setUploadError('Please select image files (JPEG, PNG, WebP, or GIF).')
      input.value = ''
      return
    }
    setUploadError(null)
    setPendingFiles((prev) => [...prev, ...list])
    input.value = ''
  }, [])

  const { fields: flavorFields, append: appendFlavor, remove: removeFlavor } = useFieldArray({
    control,
    name: 'flavors',
  })

  useEffect(() => {
    if (event && !isLoading) {
      const maxIndex = Math.max(0, (event.images?.length ?? 1) - 1)
      setPendingFiles([])
      reset({
        title: event.title,
        slug: event.slug,
        location: event.location,
        pax: event.pax,
        description: event.description,
        images: event.images.length ? event.images : [''],
        featured_image_index: Math.min(event.featured_image_index ?? 0, maxIndex),
        event_date: event.event_date,
        category: event.category,
        flavors: event.flavors.length ? event.flavors : [''],
      })
    }
  }, [event, isLoading, reset])

  const { mutate: addEvent } = useAddEvent()
  const { mutate: updateEvent } = useUpdateEvent()

  const existingUrls = (getValues('images') ?? []).filter((u) => u?.startsWith('http'))
  const totalImageCount = existingUrls.length + pendingFiles.length
  const featuredIndex = watch('featured_image_index') ?? 0
  const clampedFeaturedIndex = Math.min(featuredIndex, Math.max(0, totalImageCount - 1))

  const onSubmit = async (data: EventFormValues) => {
    setUploadError(null)
    const urls = data.images.filter((u) => u && u.startsWith('http'))
    if (urls.length === 0 && pendingFiles.length === 0) {
      setUploadError('Attach at least one image, then save.')
      return
    }
    let allUrls = urls
    if (pendingFiles.length > 0) {
      try {
        const uploaded = await Promise.all(pendingFiles.map((f) => uploadEventImage(f)))
        allUrls = [...urls, ...uploaded]
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
        return
      }
    }
    const flavors = data.flavors.filter(Boolean)
    const featured_image_index = Math.min(data.featured_image_index ?? 0, Math.max(0, allUrls.length - 1))
    const payload = { ...data, images: allUrls, flavors, featured_image_index }

    if (isEditing && event) {
      updateEvent(
        { id: event.id, values: payload },
        { onSuccess: () => navigate({ to: '/events' }) },
      )
    } else {
      addEvent(payload, { onSuccess: () => navigate({ to: '/events' }) })
    }
  }

  if (isLoading && eventId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading event...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/events' })}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Event' : 'New Event'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isEditing
            ? 'Update the event. Shown on the Deja Bros website /events.'
            : 'Add a portfolio event. It will appear on the Deja Bros website /events.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g. Rodriguez-Santos Wedding"
            className={cn(errors.title && 'border-destructive')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            {...(() => {
              const { onChange, ...rest } = register('slug')
              return {
                ...rest,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  userHasEditedSlugRef.current = true
                  onChange(e)
                },
              }
            })()}
            placeholder="e.g. rodriguez-santos-wedding"
            className={cn(errors.slug && 'border-destructive')}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="e.g. The Farm at San Benito, Batangas"
            className={cn(errors.location && 'border-destructive')}
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pax">Pax *</Label>
            <Input
              id="pax"
              type="number"
              {...register('pax', { valueAsNumber: true })}
              className={cn(errors.pax && 'border-destructive')}
            />
            {errors.pax && (
              <p className="text-sm text-destructive">{errors.pax.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event_date">Event Date *</Label>
            <Input
              id="event_date"
              type="date"
              {...register('event_date')}
              className={cn(errors.event_date && 'border-destructive')}
            />
            {errors.event_date && (
              <p className="text-sm text-destructive">{errors.event_date.message}</p>
            )}
          </div>
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watch('category')}
            onValueChange={(v) => setValue('category', v as EventFormValues['category'])}
          >
            <SelectTrigger className={cn('w-full', errors.category && 'border-destructive')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="private">Private Event</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={4}
            className={cn(errors.description && 'border-destructive')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Images * (at least one)</Label>
            {isStorageConfigured() ? (
              <>
                <input
                  ref={imageInputRef}
                  id="event-images-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                  multiple
                  className="sr-only"
                  onChange={handleAttachImages}
                  aria-label="Attach images"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && imageInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Attach images
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Configure Supabase storage to upload images.
              </p>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            Attach images here; they are uploaded when you save. Click the star to set the featured/cover image.
            {isStorageConfigured() && (
              <> Using S3 API. Ensure bucket &quot;deja-bros-events&quot; exists in the same project as VITE_SUPABASE_URL.</>
            )}
          </p>
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
          <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-sm">
            <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Event images
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {imageFields.map((field, i) => {
                const url = watch(`images.${i}`)
                const isFeatured = clampedFeaturedIndex === i
                const hasValidImage = url && url.startsWith('http')
                return (
                  <div
                    key={field.id}
                    className={cn(
                      ALBUM_THUMB_CLASS,
                      isFeatured && 'ring-2 ring-primary ring-offset-2',
                    )}
                  >
                    {hasValidImage ? (
                      <img
                        src={url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                    {hasValidImage && (
                      <Button
                        type="button"
                        variant={isFeatured ? 'default' : 'secondary'}
                        size="icon"
                        className="absolute left-1.5 top-1.5 h-7 w-7 shadow"
                        onClick={() => setValue('featured_image_index', i)}
                        title={isFeatured ? 'Featured image' : 'Set as featured image'}
                      >
                        <Star className={cn('h-3.5 w-3.5', isFeatured && 'fill-current')} />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-1.5 top-1.5 h-7 w-7 shadow"
                      onClick={() => {
                        const newMaxIndex = Math.max(0, imageFields.length - 2 + pendingFiles.length)
                        const newFeatured =
                          i < featuredIndex
                            ? featuredIndex - 1
                            : i === featuredIndex
                              ? Math.min(featuredIndex, Math.max(0, newMaxIndex))
                              : featuredIndex
                        setValue('featured_image_index', Math.max(0, newFeatured))
                        removeImage(i)
                      }}
                      disabled={imageFields.length <= 1 && pendingFiles.length === 0}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
              {pendingFiles.map((file, pendingIndex) => {
              const i = imageFields.length + pendingIndex
              const isFeatured = clampedFeaturedIndex === i
              return (
                <PendingImageThumb
                  key={`pending-${pendingIndex}-${file.name}`}
                  file={file}
                  isFeatured={isFeatured}
                  onSetFeatured={() => setValue('featured_image_index', i)}
                  onRemove={() => {
                    const newMaxIndex = Math.max(0, imageFields.length + pendingFiles.length - 2)
                    const newFeatured =
                      i < featuredIndex
                        ? featuredIndex - 1
                        : i === featuredIndex
                          ? Math.min(featuredIndex, Math.max(0, newMaxIndex))
                          : featuredIndex
                    setValue('featured_image_index', Math.max(0, newFeatured))
                    setPendingFiles((prev) => prev.filter((_, idx) => idx !== pendingIndex))
                  }}
                  canRemove={imageFields.length + pendingFiles.length > 1}
                />
              )
            })}
            </div>
          </div>
          {errors.images?.root && (
            <p className="text-sm text-destructive">{errors.images.root.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Flavors (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendFlavor('')}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
          {flavorFields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`flavors.${i}`)}
                placeholder="e.g. Vanilla Latte"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFlavor(i)}
                disabled={flavorFields.length <= 1}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/events' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
