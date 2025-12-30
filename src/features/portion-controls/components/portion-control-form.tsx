import { useEffect, useCallback, useState, useMemo } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  useAddPortionControl,
  useGetPortionControl,
  useGetProductVariantOptions,
  useUpdatePortionControl,
} from '../hooks'
import { portionControlFormSchema } from '../schema/portion-control-form'
import type { PortionControlFormValues } from '../schema/portion-control-form'
import type { PortionControlWithDetails } from '../types'
import { useGetProducts } from '@/features/products/hooks'
import { getProduct } from '@/features/products/services/products.service'
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

// Product Combobox for ingredient selection
function ProductCombobox({
  value,
  onValueChange,
  products,
  disabled,
}: {
  value: string
  onValueChange: (value: string) => void
  products: Array<{ id: string; name: string }>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedProduct = products.find((p) => p.id === value)

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [products, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-white border-stone-300 hover:bg-stone-50 text-left font-normal"
        >
          <span className="truncate">
            {selectedProduct ? selectedProduct.name : 'Select product...'}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search products..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onValueChange(product.id)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === product.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
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

  const portionControl =
    portionControlProp || fetchedPortionControl || null

  const { data: productVariantOptions } = useGetProductVariantOptions()
  const { data: products } = useGetProducts()

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
    watch,
  } = useForm<PortionControlFormValues>({
    resolver: zodResolver(portionControlFormSchema),
    defaultValues: {
      product_id: '',
      variant_id: null,
      name: '',
      description: null,
      serving_size: null,
      items: [{ ingredient_name: '', quantity: 1, unit: 'pcs' }],
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
        items:
          portionControl.items?.map((item) => ({
            ingredient_product_id: item.ingredient_product_id || null,
            ingredient_variant_id: item.ingredient_variant_id || null,
            ingredient_name: item.ingredient_name,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes || null,
          })) || [{ ingredient_name: '', quantity: 1, unit: 'pcs' }],
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
        items: [{ ingredient_name: '', quantity: 1, unit: 'pcs' }],
      })
      setSelectedProductVariant(null)
    }
  }, [
    portionControl,
    isLoadingPortionControl,
    reset,
    fetchProductVariants,
  ])

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
      quantity: 1,
      unit: 'pcs',
      ingredient_product_id: null,
      ingredient_variant_id: null,
      notes: null,
    })
  }, [appendItem])

  const handleProductVariantChange = useCallback(
    (value: string) => {
      const option = productVariantOptions?.find((opt) => opt.id === value)
      if (option) {
        setSelectedProductVariant({
          product_id: option.product_id,
          variant_id: option.variant_id,
        })
        setValue('product_id', option.product_id)
        setValue('variant_id', option.variant_id || null)

        // Fetch variants if needed
        if (option.product_id) {
          fetchProductVariants(option.product_id)
        }
      }
    },
    [productVariantOptions, setValue, fetchProductVariants],
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
    <div className="container mx-auto py-4 px-4 max-w-4xl">
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
            <Select
              value={selectedOptionId}
              onValueChange={handleProductVariantChange}
              disabled={isSubmitting || isEditing}
            >
              <SelectTrigger
                id="product_variant"
                className={cn(
                  'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 w-full h-11 text-base',
                  errors.product_id &&
                    'border-destructive focus-visible:border-destructive',
                )}
              >
                <SelectValue placeholder="Select product or variant" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {productVariantOptions?.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <TableHead className="min-w-[120px]">Ingredient</TableHead>
                      <TableHead className="min-w-[100px]">Product</TableHead>
                      <TableHead className="min-w-[80px]">Quantity</TableHead>
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
                          {products && (
                            <ProductCombobox
                              value={
                                watch(
                                  `items.${itemIndex}.ingredient_product_id` as const,
                                ) || ''
                              }
                              onValueChange={(value) => {
                                setValue(
                                  `items.${itemIndex}.ingredient_product_id` as const,
                                  value,
                                )
                                // Fetch variants
                                fetchProductVariants(value)
                              }}
                              products={products.map((p) => ({
                                id: p.id,
                                name: p.name,
                              }))}
                              disabled={isSubmitting}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${itemIndex}.quantity` as const}
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
                                  errors.items?.[itemIndex]?.quantity &&
                                    'border-destructive',
                                )}
                              />
                            )}
                          />
                          {errors.items?.[itemIndex]?.quantity && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[itemIndex]?.quantity?.message}
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

