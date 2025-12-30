import { useEffect, useCallback, useState, useMemo } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  useAddPortionControl,
  useGetPortionControl,
  useGetProductVariantOptions,
  useGetGroupedProductVariants,
  useUpdatePortionControl,
} from '../hooks'
import { portionControlFormSchema } from '../schema/portion-control-form'
import type { PortionControlFormValues } from '../schema/portion-control-form'
import type { PortionControlWithDetails } from '../types'
import { getProduct } from '@/features/products/services/products.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PortionControlFormProps {
  portionControl?: PortionControlWithDetails | null
}

// Product/Variant Combobox for recipe selection (searchable with grouping)
function ProductVariantCombobox({
  value,
  onValueChange,
  groupedProductVariants,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  groupedProductVariants:
    | Array<{
        product_id: string
        product_name: string
        category_name: string | null
        has_variants: boolean
        variants: Array<{ id: string; variant_id: string; name: string }>
      }>
    | undefined
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Find selected option
  const selectedOption = useMemo(() => {
    if (!groupedProductVariants || !value) return null

    for (const group of groupedProductVariants) {
      if (value === `product-${group.product_id}`) {
        const categoryLabel = group.category_name
          ? `[${group.category_name}] `
          : ''
        return {
          type: 'product',
          name: `${categoryLabel}${group.product_name}`,
        }
      }
      const variant = group.variants.find((v) => v.id === value)
      if (variant) {
        const categoryLabel = group.category_name
          ? `[${group.category_name}] `
          : ''
        return {
          type: 'variant',
          name: `${categoryLabel}${group.product_name} - ${variant.name}`,
        }
      }
    }
    return null
  }, [groupedProductVariants, value])

  // Filter options based on search query
  const filteredGroups = useMemo(() => {
    if (!groupedProductVariants) return []
    if (!searchQuery) return groupedProductVariants

    const query = searchQuery.toLowerCase()
    return groupedProductVariants
      .map((group) => {
        const categoryMatches = group.category_name
          ?.toLowerCase()
          .includes(query)
        const productMatches = group.product_name.toLowerCase().includes(query)
        const matchingVariants = group.variants.filter((variant) =>
          variant.name.toLowerCase().includes(query),
        )

        if (categoryMatches || productMatches || matchingVariants.length > 0) {
          return {
            ...group,
            variants:
              categoryMatches || productMatches
                ? group.variants
                : matchingVariants,
          }
        }
        return null
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)
  }, [groupedProductVariants, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-white border-stone-300 hover:bg-stone-50 text-left font-normal h-11"
        >
          <span className="truncate">
            {selectedOption
              ? selectedOption.name
              : 'Select product or variant...'}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products or variants..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No products or variants found.</CommandEmpty>
            {filteredGroups.map((group) => {
              const categoryLabel = group.category_name
                ? `[${group.category_name}] `
                : ''
              if (group.has_variants) {
                // Product with variants: show product as label, variants as items
                return (
                  <CommandGroup key={group.product_id}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-stone-700">
                      {categoryLabel}
                      {group.product_name}
                    </div>
                    {group.variants.map((variant) => (
                      <CommandItem
                        key={variant.id}
                        value={`${group.product_name} ${variant.name}`}
                        onSelect={() => {
                          onValueChange(variant.id)
                          setOpen(false)
                          setSearchQuery('')
                        }}
                        className="pl-6"
                      >
                        <CheckIcon
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === variant.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {categoryLabel}
                        {group.product_name} - {variant.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              } else {
                // Product without variants: show as selectable item
                return (
                  <CommandItem
                    key={`product-${group.product_id}`}
                    value={group.product_name}
                    onSelect={() => {
                      onValueChange(`product-${group.product_id}`)
                      setOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === `product-${group.product_id}`
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {categoryLabel}
                    {group.product_name}
                  </CommandItem>
                )
              }
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function PortionControlForm({
  portionControl: portionControlProp,
}: PortionControlFormProps) {
  const navigate = useNavigate()
  const isEditing = Boolean(portionControlProp)
  const { data: fetchedPortionControl, isLoading: isLoadingPortionControl } =
    useGetPortionControl(portionControlProp?.id || null)

  const portionControl = portionControlProp || fetchedPortionControl || null

  const { data: productVariantOptions } = useGetProductVariantOptions()
  const { data: groupedProductVariants } = useGetGroupedProductVariants()

  const [selectedProductVariant, setSelectedProductVariant] = useState<{
    product_id: string
    variant_id: string | null
  } | null>(null)

  const [productVariants, setProductVariants] = useState<
    Map<string, Array<{ id: string; name: string }>>
  >(new Map())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
  } = useForm<PortionControlFormValues>({
    resolver: zodResolver(portionControlFormSchema),
    defaultValues: {
      product_id: '',
      variant_id: null,
      name: '',
      description: null,
      serving_size: null,
      items: [{ ingredient_name: '', serving_size: 1, unit: 'pcs' }],
    },
  })

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'items',
  })

  // Fetch variants for a product
  const fetchProductVariants = useCallback(
    async (productId: string) => {
      if (productVariants.has(productId)) return

      try {
        const product = await getProduct(productId)
        const variants = (product.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
        }))
        setProductVariants((prev) => new Map(prev).set(productId, variants))
      } catch (error) {
        console.error('Failed to fetch product variants:', error)
      }
    },
    [productVariants],
  )

  // Reset form when portion control changes
  useEffect(() => {
    if (portionControl && !isLoadingPortionControl) {
      setSelectedProductVariant({
        product_id: portionControl.product_id,
        variant_id: portionControl.variant_id,
      })

      reset({
        product_id: portionControl.product_id,
        variant_id: portionControl.variant_id,
        name: portionControl.name,
        description: portionControl.description || null,
        serving_size: portionControl.serving_size || null,
        items: portionControl.items?.map((item) => ({
          ingredient_product_id: item.ingredient_product_id || null,
          ingredient_variant_id: item.ingredient_variant_id || null,
          ingredient_name: item.ingredient_name,
          serving_size: item.serving_size,
          unit: item.unit,
          notes: item.notes || null,
        })) || [{ ingredient_name: '', serving_size: 1, unit: 'pcs' }],
      })

      // Fetch variants for the product
      if (portionControl.product_id) {
        fetchProductVariants(portionControl.product_id)
      }
    } else if (!portionControl) {
      reset({
        product_id: '',
        variant_id: null,
        name: '',
        description: null,
        serving_size: null,
        items: [{ ingredient_name: '', serving_size: 1, unit: 'pcs' }],
      })
      setSelectedProductVariant(null)
    }
  }, [portionControl, isLoadingPortionControl, reset, fetchProductVariants])

  const { mutate: addPortionControl, isPending: isAdding } =
    useAddPortionControl()
  const { mutate: updatePortionControl, isPending: isUpdating } =
    useUpdatePortionControl()
  const isPending = isAdding || isUpdating

  const onSubmit = (data: PortionControlFormValues) => {
    if (isEditing && portionControl) {
      updatePortionControl(
        { id: portionControl.id, ...data },
        {
          onSuccess: () => {
            navigate({ to: '/portion-controls' })
          },
        },
      )
    } else {
      addPortionControl(data, {
        onSuccess: () => {
          navigate({ to: '/portion-controls' })
        },
      })
    }
  }

  const addItem = useCallback(() => {
    appendItem({
      ingredient_name: '',
      serving_size: 1,
      unit: 'pcs' as const,
      ingredient_product_id: null,
      ingredient_variant_id: null,
      notes: null,
    })
  }, [appendItem])

  const handleProductVariantChange = useCallback(
    (value: string) => {
      // Try to find in grouped structure first (more efficient)
      let productId: string | null = null
      let variantId: string | null = null

      if (groupedProductVariants) {
        for (const group of groupedProductVariants) {
          if (value === `product-${group.product_id}`) {
            productId = group.product_id
            variantId = null
            break
          }
          const variant = group.variants.find((v) => v.id === value)
          if (variant) {
            productId = group.product_id
            variantId = variant.variant_id
            break
          }
        }
      }

      // Fallback to flat structure if not found
      if (!productId && productVariantOptions) {
        const option = productVariantOptions.find((opt) => opt.id === value)
        if (option) {
          productId = option.product_id
          variantId = option.variant_id
        }
      }

      if (productId) {
        setSelectedProductVariant({
          product_id: productId,
          variant_id: variantId,
        })
        setValue('product_id', productId)
        setValue('variant_id', variantId || null)

        // Fetch variants if needed
        if (productId) {
          fetchProductVariants(productId)
        }
      }
    },
    [
      groupedProductVariants,
      productVariantOptions,
      setValue,
      fetchProductVariants,
    ],
  )

  const selectedOptionId = useMemo(() => {
    if (!selectedProductVariant) return ''
    if (selectedProductVariant.variant_id) {
      return `variant-${selectedProductVariant.variant_id}`
    }
    return `product-${selectedProductVariant.product_id}`
  }, [selectedProductVariant])

  if (isLoadingPortionControl && portionControl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 w-full">
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/portion-controls' })}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isEditing ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          {isEditing
            ? 'Update the recipe information below.'
            : 'Create a new recipe for a product or variant. Fill in the details below.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:gap-6">
          {/* Product/Variant Selection */}
          <div className="grid gap-2">
            <Label htmlFor="product_variant">
              Product/Variant <span className="text-destructive">*</span>
            </Label>
            <ProductVariantCombobox
              value={selectedOptionId}
              onValueChange={handleProductVariantChange}
              groupedProductVariants={groupedProductVariants}
              disabled={isSubmitting || isEditing}
            />
            {errors.product_id && (
              <p className="text-sm text-destructive">
                {errors.product_id.message}
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Product/variant cannot be changed when editing
              </p>
            )}
          </div>

          {/* Recipe Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              Recipe Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter recipe name"
              disabled={isSubmitting}
              className={cn(
                'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 h-11 text-base',
                errors.name &&
                  'border-destructive focus-visible:border-destructive',
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter recipe description..."
              rows={3}
              disabled={isSubmitting}
              className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 text-base"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Serving Size */}
          <div className="grid gap-2">
            <Label htmlFor="serving_size">Serving Size (Optional)</Label>
            <Input
              id="serving_size"
              {...register('serving_size')}
              placeholder="e.g., 1 serving, 1 portion"
              disabled={isSubmitting}
              className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 h-11 text-base"
            />
            {errors.serving_size && (
              <p className="text-sm text-destructive">
                {errors.serving_size.message}
              </p>
            )}
          </div>

          {/* Recipe Items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Recipe Items <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={isSubmitting}
                className="border-stone-300 text-stone-700 hover:bg-stone-100 h-9"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">
                        Ingredient
                      </TableHead>
                      <TableHead className="min-w-[80px]">Serving Size</TableHead>
                      <TableHead className="min-w-[80px]">Unit</TableHead>
                      <TableHead className="min-w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemFields.map((item, itemIndex) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            {...register(
                              `items.${itemIndex}.ingredient_name` as const,
                            )}
                            placeholder="Ingredient name"
                            disabled={isSubmitting}
                            className={cn(
                              'bg-white border-stone-300 text-sm',
                              errors.items?.[itemIndex]?.ingredient_name &&
                                'border-destructive',
                            )}
                          />
                          {errors.items?.[itemIndex]?.ingredient_name && (
                            <p className="text-xs text-destructive mt-1">
                              {
                                errors.items[itemIndex]?.ingredient_name
                                  ?.message
                              }
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${itemIndex}.serving_size` as const}
                            control={control}
                            render={({ field }) => (
                              <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={field.value || ''}
                                placeholder="0"
                                disabled={isSubmitting}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ''
                                      ? 0
                                      : Number(e.target.value)
                                  field.onChange(value)
                                }}
                                className={cn(
                                  'bg-white border-stone-300 text-sm',
                                  errors.items?.[itemIndex]?.serving_size &&
                                    'border-destructive',
                                )}
                              />
                            )}
                          />
                          {errors.items?.[itemIndex]?.serving_size && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[itemIndex]?.serving_size?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${itemIndex}.unit` as const)}
                            placeholder="pcs"
                            disabled={isSubmitting}
                            className={cn(
                              'bg-white border-stone-300 text-sm',
                              errors.items?.[itemIndex]?.unit &&
                                'border-destructive',
                            )}
                          />
                          {errors.items?.[itemIndex]?.unit && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[itemIndex]?.unit?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {itemFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(itemIndex)}
                              disabled={isSubmitting}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            {errors.items && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 mt-6 pt-6 border-t border-stone-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/portion-controls' })}
            disabled={isPending}
            className="border-stone-300 text-stone-700 hover:bg-stone-100 h-11 text-base w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-stone-700 text-white hover:bg-stone-800 h-11 text-base w-full sm:w-auto"
          >
            {isPending
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Recipe'
                : 'Create Recipe'}
          </Button>
        </div>
      </form>
    </div>
  )
}
