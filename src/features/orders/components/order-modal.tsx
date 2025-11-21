import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { cn } from '@/lib/utils'

interface OrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: Order | null
}

export function OrderModal({ open, onOpenChange, order }: OrderModalProps) {
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
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_name: '',
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
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

  // Calculate total
  const watchedItems = watch('items')
  const total = watchedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0,
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
          items: items,
        })
      } else if (!order) {
        reset({
          customer_name: '',
          status: 'pending',
          order_date: new Date().toISOString().split('T')[0],
          items: [],
        })
      }
    }
  }, [open, order, orderWithItems, isLoadingOrder, reset])

  const { mutate: addOrder, isPending: isAdding } = useAddOrder()
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder()
  const isPending = isAdding || isUpdating

  const onSubmit = (data: OrderFormValues) => {
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
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen)
      if (!newOpen) {
        reset()
      }
    }
  }

  const addItem = () => {
    appendItem({
      product_id: '',
      variant_id: null,
      quantity: 1,
      price: 0,
    })
  }

  // State to store products with variants
  const [productsWithVariants, setProductsWithVariants] = useState<
    Record<string, any>
  >({})

  // Fetch product with variants when selected
  const fetchProductVariants = async (productId: string) => {
    if (productsWithVariants[productId]) return productsWithVariants[productId]

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
  }

  const getProductVariants = (productId: string) => {
    if (!productId) return []
    const productData = productsWithVariants[productId]
    return productData?.variants || []
  }

  const handleProductChange = async (
    itemIndex: number,
    productId: string,
    variantId: string | null,
  ) => {
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
  }

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

        <form onSubmit={handleSubmit(onSubmit)}>
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
                      <Select
                        value={watch(`items.${itemIndex}.product_id`)}
                        onValueChange={async (value) => {
                          await handleProductChange(itemIndex, value, null)
                        }}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-white border-stone-300 w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      (watch(`items.${itemIndex}.quantity`) || 0) *
                      (watch(`items.${itemIndex}.price`) || 0)
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

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
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
}
