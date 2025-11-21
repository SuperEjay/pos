import { useEffect, useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, CopyIcon } from 'lucide-react'
import { useAddProduct, useGetProduct, useUpdateProduct } from '../hooks'
import { productFormSchema } from '../schema/product-form'
import type { ProductFormValues } from '../schema/product-form'
import type { Product } from '../types/product'
import { useGetCategories } from '@/features/categories/hooks'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  cloneFrom?: string | null
}

export function ProductModal({
  open,
  onOpenChange,
  product,
  cloneFrom,
}: ProductModalProps) {
  const isEditing = Boolean(product)
  const isCloning = Boolean(cloneFrom && !product)
  const { data: categories } = useGetCategories()
  const { data: productWithVariants, isLoading: isLoadingProduct } =
    useGetProduct(product?.id || cloneFrom || null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      sku: null,
      price: null,
      stock: null,
      variants: [],
    },
  })

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  })

  const [showCloneDialog, setShowCloneDialog] = useState(false)

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (open) {
      if ((product || cloneFrom) && productWithVariants && !isLoadingProduct) {
        // Load product data with variants (for editing or cloning)
        const variants = (productWithVariants.variants || []).map(
          (variant: any) => ({
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku,
            options: (variant.options || []).map((option: any) => ({
              name: option.name,
              value: option.value,
            })),
          }),
        )

        reset({
          name: isCloning ? `${productWithVariants.name} (Copy)` : productWithVariants.name,
          description: productWithVariants.description || '',
          category_id: productWithVariants.category_id,
          sku: isCloning ? null : productWithVariants.sku, // Clear SKU when cloning
          price: productWithVariants.price,
          stock: productWithVariants.stock,
          variants: variants,
        })
      } else if (!product && !cloneFrom) {
        reset({
          name: '',
          description: '',
          category_id: '',
          sku: null,
          price: null,
          stock: null,
          variants: [],
        })
      }
    }
  }, [open, product, cloneFrom, productWithVariants, isLoadingProduct, reset, isCloning])

  const { mutate: addProduct, isPending: isAdding } = useAddProduct()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct()
  const isPending = isAdding || isUpdating

  const onSubmit = (data: ProductFormValues) => {
    if (isEditing && product) {
      updateProduct(
        { id: product.id, ...data },
        {
          onSuccess: () => {
            handleOpenChange(false)
            reset()
          },
        },
      )
    } else {
      addProduct(data, {
        onSuccess: () => {
          handleOpenChange(false)
          reset()
        },
      })
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

  const addVariant = useCallback(() => {
    appendVariant({
      name: '',
      price: null,
      stock: null,
      sku: null,
      options: [] as Array<{ name: string; value: string }>,
    })
  }, [appendVariant])

  const cloneVariant = useCallback(
    (sourceVariantIndex: number) => {
      const sourceVariant = variantFields[sourceVariantIndex]
      if (!sourceVariant) return

      const variantValues = watch(`variants.${sourceVariantIndex}`)
      appendVariant({
        name: `${variantValues.name || 'Variant'} (Copy)`,
        price: variantValues.price,
        stock: variantValues.stock,
        sku: null, // Clear SKU when cloning
        options: (variantValues.options || []).map((option: any) => ({
          name: option.name || '',
          value: option.value || '',
        })),
      })
    },
    [variantFields, watch, appendVariant],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? 'Edit Product'
              : isCloning
                ? 'Clone Product'
                : 'Create Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the product information below.'
              : isCloning
                ? 'Create a new product based on the selected product. You can modify the details below.'
                : 'Add a new product to your system. Fill in the details below.'}
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
                placeholder="Enter product name"
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
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter product description"
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

            <div className="grid gap-2">
              <Label htmlFor="category_id">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('category_id')}
                onValueChange={(value) => setValue('category_id', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={cn(
                    'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 w-full',
                    errors.category_id &&
                      'border-destructive focus-visible:border-destructive',
                  )}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="Enter SKU (optional)"
                  disabled={isSubmitting}
                  className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">
                    {errors.sku.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="Enter price (optional)"
                  disabled={isSubmitting}
                  className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="Enter stock (optional)"
                  disabled={isSubmitting}
                  className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
                />
                {errors.stock && (
                  <p className="text-sm text-destructive">
                    {errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <div className="flex gap-2">
                  {variantFields.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCloneDialog(true)}
                      disabled={isSubmitting}
                      className="border-stone-300 text-stone-700 hover:bg-stone-100"
                    >
                      <CopyIcon className="w-4 h-4 mr-2" />
                      Clone Variant
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    disabled={isSubmitting}
                    className="border-stone-300 text-stone-700 hover:bg-stone-100"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </div>

              {variantFields.map((variant, variantIndex) => (
                <div
                  key={variant.id}
                  className="border border-stone-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variant {variantIndex + 1}</h4>
                    <div className="flex gap-2">
                      {variantFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => cloneVariant(variantIndex)}
                          disabled={isSubmitting}
                          className="text-stone-700 hover:text-stone-900"
                          title="Clone this variant"
                        >
                          <CopyIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variantIndex)}
                        disabled={isSubmitting}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>
                        Variant Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register(
                          `variants.${variantIndex}.name` as const,
                        )}
                        placeholder="Enter variant name"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                      {errors.variants?.[variantIndex]?.name && (
                        <p className="text-sm text-destructive">
                          {errors.variants[variantIndex]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>SKU</Label>
                      <Input
                        {...register(
                          `variants.${variantIndex}.sku` as const,
                        )}
                        placeholder="Enter SKU (optional)"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(
                          `variants.${variantIndex}.price` as const,
                          { valueAsNumber: true },
                        )}
                        placeholder="Enter price (optional)"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        {...register(
                          `variants.${variantIndex}.stock` as const,
                          { valueAsNumber: true },
                        )}
                        placeholder="Enter stock (optional)"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                    </div>
                  </div>

                  <VariantOptions
                    variantIndex={variantIndex}
                    register={register}
                    control={control}
                    errors={errors}
                    isSubmitting={isSubmitting}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-stone-700 text-white hover:bg-stone-800"
            >
              {isPending
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Product'
                  : isCloning
                    ? 'Clone Product'
                    : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Clone Variant Dialog */}
      {showCloneDialog && variantFields.length > 0 && (
        <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Clone Variant</DialogTitle>
              <DialogDescription>
                Select a variant to clone. All details will be copied to a new variant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {variantFields.map((variant, index) => {
                const variantName = watch(`variants.${index}.name`) || `Variant ${index + 1}`
                return (
                  <Button
                    key={variant.id}
                    type="button"
                    variant="outline"
                    className="w-full justify-start border-stone-300 text-stone-700 hover:bg-stone-100"
                    onClick={() => {
                      cloneVariant(index)
                      setShowCloneDialog(false)
                    }}
                    disabled={isSubmitting}
                  >
                    <CopyIcon className="w-4 h-4 mr-2" />
                    {variantName}
                  </Button>
                )
              })}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCloneDialog(false)}
                className="border-stone-300 text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}

// VariantOptions component for managing options within a variant
function VariantOptions({
  variantIndex,
  register,
  control,
  errors,
  isSubmitting,
}: {
  variantIndex: number
  register: any
  control: any
  errors: any
  isSubmitting: boolean
}) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `variants.${variantIndex}.options` as const,
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendOption({
              name: '',
              value: '',
            })
          }
          disabled={isSubmitting}
          className="border-stone-300 text-stone-700 hover:bg-stone-100 h-8"
        >
          <PlusIcon className="w-3 h-3 mr-1" />
          Add Option
        </Button>
      </div>

      {optionFields.map((option, optionIndex) => (
        <div
          key={option.id}
          className="flex gap-2 items-start p-2 bg-stone-50 rounded"
        >
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Input
                {...register(
                  `variants.${variantIndex}.options.${optionIndex}.name` as const,
                )}
                placeholder="Option name"
                disabled={isSubmitting}
                className="bg-white border-stone-300 h-8"
              />
              {errors.variants?.[variantIndex]?.options?.[optionIndex]?.name && (
                <p className="text-xs text-destructive">
                  {
                    errors.variants[variantIndex]?.options?.[optionIndex]?.name
                      ?.message
                  }
                </p>
              )}
            </div>
            <div className="grid gap-1">
              <Input
                {...register(
                  `variants.${variantIndex}.options.${optionIndex}.value` as const,
                )}
                placeholder="Option value"
                disabled={isSubmitting}
                className="bg-white border-stone-300 h-8"
              />
              {errors.variants?.[variantIndex]?.options?.[optionIndex]
                ?.value && (
                <p className="text-xs text-destructive">
                  {
                    errors.variants[variantIndex]?.options?.[optionIndex]?.value
                      ?.message
                  }
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeOption(optionIndex)}
            disabled={isSubmitting}
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
          >
            <TrashIcon className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}

