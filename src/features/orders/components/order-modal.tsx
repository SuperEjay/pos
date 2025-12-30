import { memo, useEffect, useState, useMemo, useCallback } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'
import { useAddOrder, useGetOrder, useUpdateOrder } from '../hooks'
import { orderFormSchema } from '../schema/order-form'
import type { OrderFormValues } from '../schema/order-form'
import type { Order } from '../types/order'
import { useGetProducts } from '@/features/products/hooks'
import { getProduct } from '@/features/products/services/products.service'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useGetCategories } from '@/features/categories/hooks'

interface ProductComboboxProps {
  value: string
  onValueChange: (value: string) => void
  products: Array<{ id: string; name: string }>
  disabled?: boolean
}

function ProductCombobox({
  value,
  onValueChange,
  products,
  disabled,
}: ProductComboboxProps) {
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
          className="w-full justify-between bg-white border-stone-300 hover:bg-stone-50"
        >
          <span className="truncate">
            {selectedProduct ? selectedProduct.name : 'Select product...'}
          </span>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
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
                  value={product.name}
                  onSelect={() => {
                    onValueChange(product.id)
                    setOpen(false)
                    setSearchQuery('')
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

interface OrderItemSubtotalProps {
  itemIndex: number
  control: any
}

function OrderItemSubtotal({ itemIndex, control }: OrderItemSubtotalProps) {
  // Use useWatch for reactive updates
  const quantity = useWatch({ control, name: `items.${itemIndex}.quantity` as const }) || 0
  const price = useWatch({ control, name: `items.${itemIndex}.price` as const }) || 0
  const addOns = (useWatch({ control, name: `items.${itemIndex}.add_ons` as any }) as any[]) || []

  const baseSubtotal = Number(quantity) * Number(price)
  const addOnsTotal = addOns.reduce((sum, addOn) => {
    return sum + (addOn.price || 0) * (addOn.quantity || 1) * Number(quantity)
  }, 0)
  const subtotal = baseSubtotal + addOnsTotal

  return (
    <div className="text-sm text-muted-foreground">
      Subtotal: ₱{subtotal.toFixed(2)}
    </div>
  )
}

interface OrderItemAddOnsWrapperProps {
  itemIndex: number
  control: any
  setValue: any
  productsWithVariants: Record<string, any>
  addOnsProducts: Array<{ id: string; name: string; price: number | null }>
  disabled?: boolean
}

function OrderItemAddOnsWrapper({
  itemIndex,
  control,
  setValue,
  productsWithVariants,
  addOnsProducts,
  disabled,
}: OrderItemAddOnsWrapperProps) {
  // Use useWatch at the top level of the component (not in a loop)
  const watchedVariantId = useWatch({ control, name: `items.${itemIndex}.variant_id` as any })
  const variantId = (watchedVariantId as unknown as string | null | undefined) || null
  
  return (
    <OrderItemAddOns
      itemIndex={itemIndex}
      control={control}
      setValue={setValue}
      variantId={variantId}
      productsWithVariants={productsWithVariants}
      addOnsProducts={addOnsProducts}
      disabled={disabled}
    />
  )
}

interface OrderItemAddOnsProps {
  itemIndex: number
  control: any
  setValue: any
  variantId: string | null | undefined
  productsWithVariants: Record<string, any>
  addOnsProducts: Array<{ id: string; name: string; price: number | null }>
  disabled?: boolean
}

function OrderItemAddOns({
  itemIndex,
  control,
  setValue,
  variantId,
  productsWithVariants,
  addOnsProducts,
  disabled,
}: OrderItemAddOnsProps) {
  const [expanded, setExpanded] = useState(false)
  // Use useWatch for reactive updates
  const watchedAddOns = useWatch({ control, name: `items.${itemIndex}.add_ons` as any })
  const addOns = (watchedAddOns as any[]) || []
  
  // Get variant add-ons
  const variantAddOns = useMemo(() => {
    if (!variantId) return []
    const variant = Object.values(productsWithVariants)
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === variantId)
    return variant?.options || []
  }, [variantId, productsWithVariants])

  const hasAddOns = variantAddOns.length > 0 || addOnsProducts.length > 0

  const handleAddOnToggle = (addOn: { name: string; value: string }, checked: boolean) => {
    const currentAddOns = [...addOns]
    const existingIndex = currentAddOns.findIndex(
      (a) => a.name === addOn.name && a.value === addOn.value
    )

    if (checked) {
      // Add or keep the add-on
      if (existingIndex >= 0) {
        // Already exists, keep it (don't change quantity if it's already there)
        return
      } else {
        // Add new add-on
        currentAddOns.push({ ...addOn, quantity: 1, price: 0 })
      }
    } else {
      // Remove the add-on when unchecked
      if (existingIndex >= 0) {
        currentAddOns.splice(existingIndex, 1)
      }
    }

    setValue(`items.${itemIndex}.add_ons`, currentAddOns, { shouldValidate: true })
  }

  const handleAddOnProductToggle = (product: { id: string; name: string; price: number | null }, checked: boolean) => {
    const currentAddOns = [...addOns]
    const existingIndex = currentAddOns.findIndex(
      (a) => a.name === 'Add-on' && a.value === product.name
    )

    if (checked) {
      // Add or keep the add-on product
      if (existingIndex >= 0) {
        // Already exists, keep it (don't change quantity if it's already there)
        return
      } else {
        // Add new add-on product
        currentAddOns.push({
          name: 'Add-on',
          value: product.name,
          quantity: 1,
          price: product.price || 0,
        })
      }
    } else {
      // Remove the add-on product when unchecked
      if (existingIndex >= 0) {
        currentAddOns.splice(existingIndex, 1)
      }
    }

    setValue(`items.${itemIndex}.add_ons`, currentAddOns, { shouldValidate: true })
  }

  const handleAddOnQuantityChange = (
    addOnName: string,
    addOnValue: string,
    delta: number
  ) => {
    const currentAddOns = [...addOns]
    const addOnIndex = currentAddOns.findIndex(
      (a) => a.name === addOnName && a.value === addOnValue
    )

    if (addOnIndex >= 0) {
      const currentQuantity = currentAddOns[addOnIndex].quantity || 1
      const newQuantity = Math.max(0, currentQuantity + delta)

      if (newQuantity === 0) {
        currentAddOns.splice(addOnIndex, 1)
      } else {
        currentAddOns[addOnIndex] = {
          ...currentAddOns[addOnIndex],
          quantity: newQuantity,
        }
      }

      setValue(`items.${itemIndex}.add_ons`, currentAddOns, { shouldValidate: true })
    }
  }

  if (!hasAddOns) return null

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border-t border-stone-200 pt-3 mt-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="w-full flex items-center justify-between text-sm text-stone-700 hover:text-stone-900 transition-colors py-1.5 px-1 rounded hover:bg-stone-100 disabled:opacity-50"
          >
            <span className="font-semibold">
              Customize with Add-ons {addOns.length > 0 && (
                <span className="text-stone-600 font-normal">
                  ({addOns.reduce((sum, a) => sum + (a.quantity || 1), 0)} items)
                </span>
              )}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 pl-3 border-l-2 border-stone-300">
          {/* Variant Options */}
          {variantAddOns.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-sm font-semibold text-stone-800 mb-1.5">
                Options
              </div>
              {variantAddOns.map((addOn: any, addOnIndex: number) => {
                const selectedAddOn = addOns.find(
                  (a) => a.name === addOn.name && a.value === addOn.value
                )
                const isSelected = !!selectedAddOn
                const quantity = selectedAddOn?.quantity || 0
                return (
                  <div
                    key={`variant-${addOnIndex}`}
                    className="flex items-center gap-2.5 p-1.5 rounded hover:bg-stone-50 transition-colors"
                  >
                    <Checkbox
                      id={`addon-${itemIndex}-variant-${addOnIndex}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleAddOnToggle(addOn, checked === true)}
                      disabled={disabled}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`addon-${itemIndex}-variant-${addOnIndex}`}
                      className="text-sm text-stone-700 cursor-pointer flex-1"
                    >
                      <span className="font-medium">{addOn.name}:</span>{' '}
                      <span className="text-stone-600">{addOn.value}</span>
                    </label>
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOnQuantityChange(addOn.name, addOn.value, -1)}
                          disabled={disabled}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-semibold w-6 text-center">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOnQuantityChange(addOn.name, addOn.value, 1)}
                          disabled={disabled}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {/* Add-on Products */}
          {addOnsProducts.length > 0 && (
            <div className="space-y-2.5">
              {variantAddOns.length > 0 && (
                <div className="text-sm font-semibold text-stone-800 mb-1.5 pt-2 border-t border-stone-200">
                  Additional Add-ons
                </div>
              )}
              {!variantAddOns.length && (
                <div className="text-sm font-semibold text-stone-800 mb-1.5">
                  Available Add-ons
                </div>
              )}
              {addOnsProducts.map((product) => {
                const selectedAddOn = addOns.find(
                  (a) => a.name === 'Add-on' && a.value === product.name
                )
                const isSelected = !!selectedAddOn
                const quantity = selectedAddOn?.quantity || 0
                const addOnPrice = product.price || 0
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-2.5 p-1.5 rounded hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <Checkbox
                        id={`addon-${itemIndex}-product-${product.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleAddOnProductToggle(product, checked === true)}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`addon-${itemIndex}-product-${product.id}`}
                        className="text-sm text-stone-700 cursor-pointer flex-1"
                      >
                        <span className="font-medium">{product.name}</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {addOnPrice > 0 && (
                        <span className="text-sm font-semibold text-stone-900 whitespace-nowrap">
                          +₱{addOnPrice.toFixed(2)}
                        </span>
                      )}
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOnQuantityChange('Add-on', product.name, -1)}
                            disabled={disabled}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOnQuantityChange('Add-on', product.name, 1)}
                            disabled={disabled}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Selected Add-ons Display */}
          {addOns.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-xs font-medium text-stone-600 mb-1">
                Selected:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {addOns.map((addOn, addOnIndex) => {
                  const addOnQuantity = addOn.quantity || 1
                  return (
                    <Badge
                      key={addOnIndex}
                      variant="secondary"
                      className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5"
                    >
                      {addOn.name}: {addOn.value}
                      {addOnQuantity > 1 && (
                        <span className="ml-1 font-semibold">×{addOnQuantity}</span>
                      )}
                      {addOn.price !== undefined && addOn.price > 0 && (
                        <span className="ml-1 font-semibold">
                          +₱{(addOn.price * addOnQuantity).toFixed(2)}
                        </span>
                      )}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

interface OrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: Order | null
}

export const OrderModal = memo(function OrderModal({
  open,
  onOpenChange,
  order,
}: OrderModalProps) {
  const isEditing = Boolean(order)
  const { data: products } = useGetProducts()
  const { data: categories } = useGetCategories()
  const { data: orderWithItems, isLoading: isLoadingOrder } = useGetOrder(
    order?.id || null,
  )

  // Get add-ons category products
  const addOnsProducts = useMemo(() => {
    if (!categories || !products) return []
    const addOnsCategory = categories.find((cat) => cat.name.toLowerCase() === 'add-ons')
    if (!addOnsCategory) return []
    return products.filter((p) => p.category_id === addOnsCategory.id && p.is_active)
  }, [categories, products])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema) as any,
    defaultValues: {
      customer_name: '',
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
      order_type: 'pickup',
      delivery_fee: null,
      payment_method: null,
      items: [],
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

  // Calculate total - use useWatch for better reactivity
  const watchedItems = useWatch({ control, name: 'items' }) || []
  const watchedOrderType = useWatch({ control, name: 'order_type' })
  const watchedDeliveryFee = useWatch({ control, name: 'delivery_fee' })
  const itemsTotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const baseSubtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0)
      const addOnsTotal = ((item.add_ons as any[]) || []).reduce((addOnSum, addOn) => {
        const addOnQuantity = addOn.quantity || 1
        return addOnSum + (addOn.price || 0) * addOnQuantity * (Number(item.quantity) || 0)
      }, 0)
      return sum + baseSubtotal + addOnsTotal
    }, 0)
  }, [watchedItems])
  const deliveryFee = useMemo(
    () =>
      watchedOrderType === 'delivery' && watchedDeliveryFee
        ? Number(watchedDeliveryFee)
        : 0,
    [watchedOrderType, watchedDeliveryFee],
  )
  const total = useMemo(
    () => itemsTotal + deliveryFee,
    [itemsTotal, deliveryFee],
  )

  // Reset form when modal opens/closes or order changes
  useEffect(() => {
    if (open) {
      if (order && orderWithItems && !isLoadingOrder) {
        const items = (orderWithItems.items || []).map((item: any) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price: item.price,
          add_ons: (item.add_ons || []).map((addOn: any) => ({
            name: addOn.name,
            value: addOn.value,
            price: addOn.price || 0,
            quantity: addOn.quantity || 1,
          })),
        }))

        reset({
          customer_name: order.customer_name,
          status: order.status,
          order_date: order.order_date.split('T')[0],
          order_type: order.order_type || 'pickup',
          delivery_fee: order.delivery_fee || null,
          payment_method: order.payment_method || null,
          items: items,
        })

        // Fetch product variants for all items to display variant add-ons (after reset)
        // This is done asynchronously and doesn't block the form reset
        items.forEach((item: any) => {
          if (item.product_id) {
            fetchProductVariants(item.product_id).catch(console.error)
          }
        })
      } else if (!order) {
        reset({
          customer_name: '',
          status: 'pending',
          order_date: new Date().toISOString().split('T')[0],
          order_type: 'pickup',
          delivery_fee: null,
          payment_method: null,
          items: [],
        })
      }
    }
  }, [open, order, orderWithItems, isLoadingOrder, reset])

  const { mutate: addOrder, isPending: isAdding } = useAddOrder()
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder()
  const isPending = isAdding || isUpdating

  const onSubmit = useCallback(
    (data: OrderFormValues) => {
      if (isEditing && order) {
        updateOrder(
          { id: order.id, ...data },
          {
            onSuccess: () => {
              handleOpenChange(false)
              reset()
            },
          },
        )
      } else {
        addOrder(data, {
          onSuccess: () => {
            handleOpenChange(false)
            reset()
          },
        })
      }
    },
    [isEditing, order, updateOrder, addOrder, reset],
  )

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isSubmitting) {
        onOpenChange(newOpen)
        if (!newOpen) {
          reset()
        }
      }
    },
    [isSubmitting, onOpenChange, reset],
  )

  const addItem = useCallback(() => {
    appendItem({
      product_id: '',
      variant_id: null,
      quantity: 1,
      price: 0,
      add_ons: [],
    })
  }, [appendItem])

  // State to store products with variants
  const [productsWithVariants, setProductsWithVariants] = useState<
    Record<string, any>
  >({})

  // Fetch product with variants when selected
  const fetchProductVariants = useCallback(
    async (productId: string) => {
      if (productsWithVariants[productId])
        return productsWithVariants[productId]

      try {
        const productData = await getProduct(productId)
        setProductsWithVariants((prev) => ({
          ...prev,
          [productId]: productData,
        }))
        return productData
      } catch (error) {
        console.error('Failed to fetch product variants:', error)
        return null
      }
    },
    [productsWithVariants],
  )

  const getProductVariants = useCallback(
    (productId: string) => {
      if (!productId) return []
      const productData = productsWithVariants[productId]
      return productData?.variants || []
    },
    [productsWithVariants],
  )

  const handleProductChange = useCallback(
    async (itemIndex: number, productId: string, variantId: string | null) => {
      if (!productId || !products) return

      const product = products.find((p: any) => p.id === productId)
      if (!product) return

      // Fetch product variants
      await fetchProductVariants(productId)

      // Set product price if no variant is selected
      if (!variantId && product.price) {
        setValue(`items.${itemIndex}.price`, product.price)
      }

      setValue(`items.${itemIndex}.product_id`, productId)
      if (variantId) {
        setValue(`items.${itemIndex}.variant_id`, variantId)
        // Set variant price if available
        const variants = getProductVariants(productId)
        const variant = variants.find((v: any) => v.id === variantId)
        if (variant?.price) {
          setValue(`items.${itemIndex}.price`, variant.price)
        }
      } else {
        setValue(`items.${itemIndex}.variant_id`, null)
      }
    },
    [products, fetchProductVariants, getProductVariants, setValue],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Order' : 'Create Order'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the order information below.'
              : 'Add a new order to your system. Fill in the details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer_name">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customer_name"
                  {...register('customer_name')}
                  placeholder="Enter customer name"
                  disabled={isSubmitting}
                  className={cn(
                    'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200',
                    errors.customer_name &&
                      'border-destructive focus-visible:border-destructive',
                  )}
                />
                {errors.customer_name && (
                  <p className="text-sm text-destructive">
                    {errors.customer_name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) =>
                    setValue('status', value as OrderFormValues['status'])
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className={cn(
                      'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 w-full',
                      errors.status &&
                        'border-destructive focus-visible:border-destructive',
                    )}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="order_date">
                  Order Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="order_date"
                  type="date"
                  {...register('order_date')}
                  disabled={isSubmitting}
                  className={cn(
                    'bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200',
                    errors.order_date &&
                      'border-destructive focus-visible:border-destructive',
                  )}
                />
                {errors.order_date && (
                  <p className="text-sm text-destructive">
                    {errors.order_date.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order_type">Order Type</Label>
                <Select
                  value={watch('order_type') || 'pickup'}
                  onValueChange={(value) => {
                    setValue(
                      'order_type',
                      value as 'pickup' | 'delivery' | 'dine_in',
                    )
                    if (value === 'pickup' || value === 'dine_in') {
                      setValue('delivery_fee', null)
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 w-full">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="dine_in">Dine In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {watch('order_type') === 'delivery' && (
              <div className="grid gap-2">
                <Label htmlFor="delivery_fee">Delivery Fee</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('delivery_fee', { valueAsNumber: true })}
                  placeholder="Enter delivery fee"
                  disabled={isSubmitting}
                  className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
                />
                {errors.delivery_fee && (
                  <p className="text-sm text-destructive">
                    {errors.delivery_fee.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={watch('payment_method') || 'none'}
                onValueChange={(value) => {
                  setValue(
                    'payment_method',
                    value === 'none' ? null : (value as 'cash' | 'gcash'),
                  )
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-white border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200 w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_method && (
                <p className="text-sm text-destructive">
                  {errors.payment_method.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={isSubmitting}
                  className="border-stone-300 text-stone-700 hover:bg-stone-100"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {itemFields.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="border border-stone-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {itemIndex + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(itemIndex)}
                      disabled={isSubmitting}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>
                        Product <span className="text-destructive">*</span>
                      </Label>
                      <ProductCombobox
                        value={watch(`items.${itemIndex}.product_id`)}
                        onValueChange={async (value) => {
                          await handleProductChange(itemIndex, value, null)
                        }}
                        products={products || []}
                        disabled={isSubmitting}
                      />
                      {errors.items?.[itemIndex]?.product_id && (
                        <p className="text-sm text-destructive">
                          {errors.items[itemIndex].product_id.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Variant (Optional)</Label>
                      <Select
                        value={watch(`items.${itemIndex}.variant_id`) || 'none'}
                        onValueChange={async (value) => {
                          const productId = watch(
                            `items.${itemIndex}.product_id`,
                          )
                          if (value === 'none') {
                            handleProductChange(itemIndex, productId, null)
                            // Reset price to product price
                            const product = products?.find(
                              (p: any) => p.id === productId,
                            )
                            if (product?.price) {
                              setValue(
                                `items.${itemIndex}.price`,
                                product.price,
                              )
                            }
                          } else {
                            await fetchProductVariants(productId)
                            handleProductChange(itemIndex, productId, value)
                            // Set price to variant price if available
                            const variants = getProductVariants(productId)
                            const variant = variants.find(
                              (v: any) => v.id === value,
                            )
                            if (variant?.price) {
                              setValue(
                                `items.${itemIndex}.price`,
                                variant.price,
                              )
                            }
                          }
                        }}
                        disabled={
                          isSubmitting ||
                          !watch(`items.${itemIndex}.product_id`)
                        }
                      >
                        <SelectTrigger className="bg-white border-stone-300 w-full">
                          <SelectValue placeholder="No variant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No variant</SelectItem>
                          {getProductVariants(
                            watch(`items.${itemIndex}.product_id`),
                          ).map((variant: any) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.name}
                              {variant.options &&
                                variant.options.length > 0 &&
                                ` (${variant.options
                                  .map(
                                    (opt: any) => `${opt.name}: ${opt.value}`,
                                  )
                                  .join(', ')})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>
                        Quantity <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${itemIndex}.quantity` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Enter quantity"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                      {errors.items?.[itemIndex]?.quantity && (
                        <p className="text-sm text-destructive">
                          {errors.items[itemIndex].quantity.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>
                        Price <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register(`items.${itemIndex}.price` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Enter price"
                        disabled={isSubmitting}
                        className="bg-white border-stone-300"
                      />
                      {errors.items?.[itemIndex]?.price && (
                        <p className="text-sm text-destructive">
                          {errors.items[itemIndex].price.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add-ons Section */}
                  <OrderItemAddOnsWrapper
                    itemIndex={itemIndex}
                    control={control}
                    setValue={setValue}
                    productsWithVariants={productsWithVariants}
                    addOnsProducts={addOnsProducts}
                    disabled={isSubmitting}
                  />

                  <OrderItemSubtotal
                    itemIndex={itemIndex}
                    control={control}
                  />
                </div>
              ))}

              {errors.items && typeof errors.items === 'object' && (
                <p className="text-sm text-destructive">
                  {errors.items.message || 'Please fix item errors'}
                </p>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-600">Subtotal:</span>
                <span className="font-medium">₱{itemsTotal.toFixed(2)}</span>
              </div>
              {watchedOrderType === 'delivery' &&
                watchedDeliveryFee &&
                watchedDeliveryFee > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">Delivery Fee:</span>
                    <span className="font-medium">
                      ₱{deliveryFee.toFixed(2)}
                    </span>
                  </div>
                )}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold">₱{total.toFixed(2)}</span>
              </div>
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
                  ? 'Update Order'
                  : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
