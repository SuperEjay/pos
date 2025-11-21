import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categoryFormSchema } from '../schema/category-form'
import type { Category } from '@/features/categories/types'
import type { CategoryFormValues } from '../schema/category-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSave: (data: { name: string; description: string }) => void | Promise<void>
}

export function CategoryModal({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryModalProps) {
  const isEditing = Boolean(category)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Reset form when modal opens/closes or category changes
  React.useEffect(() => {
    if (open) {
      if (category) {
        setValue('name', category.name)
        setValue('description', category.description || '')
      } else {
        reset({
          name: '',
          description: '',
        })
      }
    }
  }, [open, category, setValue, reset])

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await onSave({
        name: data.name,
        description: data.description,
      })
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category information below.'
              : 'Add a new category to your system. Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter category name"
                disabled={isSubmitting}
                className={cn(
                  'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200',
                  errors.name &&
                    'border-destructive focus-visible:border-destructive',
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter category description (optional)"
                rows={4}
                disabled={isSubmitting}
                className={cn(
                  'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200',
                  errors.description &&
                    'border-destructive focus-visible:border-destructive',
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-stone-700 text-white hover:bg-stone-800"
            >
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Category'
                  : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
