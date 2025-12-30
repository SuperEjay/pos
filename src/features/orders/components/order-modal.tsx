import { memo, useEffect, useState, useMemo, useCallback } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, TrashIcon } from 'lucide-react'
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
  const { data: orderWithItems, isLoading: isLoadingOrder } = useGetOrder(
    order?.id || null,
  )

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
  const itemsTotal = useMemo(
    () =>
      watchedItems.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      ),
    [watchedItems],
  )
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

                  <div className="text-sm text-muted-foreground">
                    Subtotal: ₱
                    {(
                      (Number(watch(`items.${itemIndex}.quantity`)) || 0) *
                      (Number(watch(`items.${itemIndex}.price`)) || 0)
                    ).toFixed(2)}
                  </div>
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
