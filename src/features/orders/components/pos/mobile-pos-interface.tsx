import { useState, useMemo, useCallback, useEffect } from 'react'
import { ShoppingCart, ArrowLeft, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useGetProducts } from '@/features/products/hooks'
import { useGetCategories } from '@/features/categories/hooks'
import { getProduct } from '@/features/products/services/products.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ProductCard } from './product-card'
import { VariantDialog } from './variant-dialog'
import { toast } from 'sonner'
import type { PaymentMethod, OrderType } from '@/features/orders/types'

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  price: number
  subtotal: number
}

interface MobilePOSInterfaceProps {
  cart: CartItem[]
  customerName: string
  orderType: OrderType | null
  deliveryFee: number
  paymentMethod: PaymentMethod | null
  notes: string
  itemsTotal: number
  total: number
  isCreatingOrder: boolean
  productsWithVariants: Record<string, any>
  selectedProductForVariant: { productId: string; productName: string } | null
  showVariantDialog: boolean
  onCartChange: (cart: CartItem[]) => void
  onCustomerNameChange: (name: string) => void
  onOrderTypeChange: (type: OrderType | null) => void
  onDeliveryFeeChange: (fee: number) => void
  onPaymentMethodChange: (method: PaymentMethod | null) => void
  onNotesChange: (notes: string) => void
  onProductsWithVariantsChange: (products: Record<string, any>) => void
  onSelectedProductForVariantChange: (
    product: { productId: string; productName: string } | null,
  ) => void
  onShowVariantDialogChange: (show: boolean) => void
  onCheckout: () => void
  onClearCart: () => void
}

export function MobilePOSInterface({
  cart,
  customerName,
  orderType,
  deliveryFee,
  paymentMethod,
  notes,
  itemsTotal,
  total,
  isCreatingOrder,
  productsWithVariants,
  selectedProductForVariant,
  showVariantDialog,
  onCartChange,
  onCustomerNameChange,
  onOrderTypeChange,
  onDeliveryFeeChange,
  onPaymentMethodChange,
  onNotesChange,
  onProductsWithVariantsChange,
  onSelectedProductForVariantChange,
  onShowVariantDialogChange,
  onCheckout,
  onClearCart,
}: MobilePOSInterfaceProps) {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { data: products } = useGetProducts()
  const { data: categories } = useGetCategories()

  // Filter out Add-ons category from display
  const filteredCategories = useMemo(() => {
    if (!categories) return []
    return categories.filter((cat) => cat.name.toLowerCase() !== 'add-ons')
  }, [categories])

  // Reset selectedCategory if it's the Add-ons category
  const addOnsCategoryId = useMemo(() => {
    if (!categories) return null
    const addOnsCategory = categories.find((cat) => cat.name.toLowerCase() === 'add-ons')
    return addOnsCategory?.id || null
  }, [categories])

  // Reset selectedCategory if it's Add-ons
  useEffect(() => {
    if (selectedCategory === addOnsCategoryId) {
      setSelectedCategory(null)
    }
  }, [selectedCategory, addOnsCategoryId])

  // Fetch product with variants
  const fetchProductVariants = useCallback(
    async (productId: string) => {
      if (productsWithVariants[productId])
        return productsWithVariants[productId]

      try {
        const productData = await getProduct(productId)
        onProductsWithVariantsChange({
          ...productsWithVariants,
          [productId]: productData,
        })
        return productData
      } catch (error) {
        console.error('Failed to fetch product variants:', error)
        return null
      }
    },
    [productsWithVariants, onProductsWithVariantsChange],
  )

  // Add item to cart
  const addToCart = useCallback(
    (
      productId: string,
      productName: string,
      variantId: string | null,
      variantName: string | null,
      price: number,
    ) => {
      onCartChange(
        (() => {
          const existingItemIndex = cart.findIndex(
            (item) =>
              item.product_id === productId && item.variant_id === variantId,
          )

          if (existingItemIndex >= 0) {
            const newCart = [...cart]
            newCart[existingItemIndex].quantity += 1
            newCart[existingItemIndex].subtotal =
              newCart[existingItemIndex].quantity *
              newCart[existingItemIndex].price
            return newCart
          } else {
            return [
              ...cart,
              {
                product_id: productId,
                product_name: productName,
                variant_id: variantId,
                variant_name: variantName,
                quantity: 1,
                price: price,
                subtotal: price,
              },
            ]
          }
        })(),
      )
    },
    [cart, onCartChange],
  )

  // Add product to cart
  const handleAddToCart = useCallback(
    async (product: any) => {
      const productData = await fetchProductVariants(product.id)
      const variants = productData?.variants || []

      if (variants.length > 0) {
        onSelectedProductForVariantChange({
          productId: product.id,
          productName: product.name,
        })
        onShowVariantDialogChange(true)
      } else {
        addToCart(product.id, product.name, null, null, product.price || 0)
        toast.success(`${product.name} added to cart`)
      }
    },
    [
      fetchProductVariants,
      addToCart,
      onSelectedProductForVariantChange,
      onShowVariantDialogChange,
    ],
  )

  // Handle variant selection
  const handleVariantSelect = useCallback(
    (variant: any) => {
      if (selectedProductForVariant) {
        const variantPrice =
          variant.price ||
          productsWithVariants[selectedProductForVariant.productId]?.price ||
          0
        addToCart(
          selectedProductForVariant.productId,
          selectedProductForVariant.productName,
          variant.id,
          variant.name,
          variantPrice,
        )
        onShowVariantDialogChange(false)
        onSelectedProductForVariantChange(null)
        toast.success(`${selectedProductForVariant.productName} added to cart`)
      }
    },
    [
      selectedProductForVariant,
      productsWithVariants,
      addToCart,
      onShowVariantDialogChange,
      onSelectedProductForVariantChange,
    ],
  )

  // Handle no variant selection
  const handleNoVariant = useCallback(() => {
    if (selectedProductForVariant) {
      const basePrice =
        productsWithVariants[selectedProductForVariant.productId]?.price || 0
      addToCart(
        selectedProductForVariant.productId,
        selectedProductForVariant.productName,
        null,
        null,
        basePrice,
      )
      onShowVariantDialogChange(false)
      onSelectedProductForVariantChange(null)
      toast.success(`${selectedProductForVariant.productName} added to cart`)
    }
  }, [
    selectedProductForVariant,
    productsWithVariants,
    addToCart,
    onShowVariantDialogChange,
    onSelectedProductForVariantChange,
  ])

  // Update cart item quantity
  const updateQuantity = useCallback(
    (index: number, delta: number) => {
      const newCart = [...cart]
      newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
      newCart[index].subtotal = newCart[index].quantity * newCart[index].price
      onCartChange(newCart)
    },
    [cart, onCartChange],
  )

  // Remove item from cart
  const removeFromCart = useCallback(
    (index: number) => {
      onCartChange(cart.filter((_, i) => i !== index))
    },
    [cart, onCartChange],
  )

  const filteredProducts = useMemo(() => {
    if (!products || !categories) return []
    
    // Get Add-ons category ID to exclude
    const addOnsCategory = categories.find((cat) => cat.name.toLowerCase() === 'add-ons')
    const addOnsCategoryId = addOnsCategory?.id
    
    return products.filter((product) => {
      // Exclude Add-ons category products
      if (addOnsCategoryId && product.category_id === addOnsCategoryId) {
        return false
      }
      
      const matchesCategory =
        !selectedCategory || product.category_id === selectedCategory
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch && product.is_active
    })
  }, [products, categories, selectedCategory, searchQuery])

  const selectedProductData = useMemo(
    () =>
      selectedProductForVariant
        ? productsWithVariants[selectedProductForVariant.productId]
        : null,
    [selectedProductForVariant, productsWithVariants],
  )

  return (
    <div className="h-screen flex flex-col bg-stone-50 safe-area-inset overflow-hidden">
      {/* Compact Header - Mobile App Style */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 shadow-sm sticky top-0 z-10 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/orders' })}
              className="h-10 w-10 shrink-0 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img
                src="/deja-bros-logo.png"
                alt="Deja Bros"
                className="h-8 w-8 object-contain shrink-0"
              />
              <h1 className="text-xl font-bold text-stone-900 truncate">
                Point of Sale
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCartOpen(true)}
            className="relative h-12 w-12 rounded-full shrink-0"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-stone-700 text-white text-xs font-bold">
                {cart.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 sticky top-[57px] z-10 space-y-3">
        <div className="relative">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 text-base bg-white border-stone-300 pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-2">
          <Label
            htmlFor="category-select-mobile"
            className="text-sm font-medium text-stone-700"
          >
            Category
          </Label>
          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) =>
              setSelectedCategory(value === 'all' ? null : value)
            }
          >
            <SelectTrigger
              id="category-select-mobile"
              className="h-12 text-base bg-white border-stone-300 w-full"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filteredCategories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-area-bottom">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleAddToCart(product)}
            />
          ))}
        </div>

        {filteredProducts?.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium">No products found</p>
            <p className="text-sm text-stone-400 mt-2">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Floating Cart Button - Shows when cart has items - Mobile App Style */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20 md:hidden safe-area-bottom">
          <Button
            onClick={() => setIsCartOpen(true)}
            size="lg"
            className="w-full h-16 text-base bg-stone-700 text-white hover:bg-stone-800 active:bg-stone-900 shadow-2xl rounded-2xl font-semibold"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                <span>
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <span className="font-bold text-lg">₱{total.toFixed(2)}</span>
            </div>
          </Button>
        </div>
      )}

      {/* Cart Bottom Sheet - Mobile App Style */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] p-0 flex flex-col rounded-t-3xl border-t-2 border-stone-200 [&>button]:hidden"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
          </div>

          <SheetHeader className="px-8 pt-4 pb-5 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-bold">
                Shopping Cart
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="h-10 w-10 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {cart.length > 0 && (
              <p className="text-sm text-stone-500 mt-2">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
              </p>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* Customer Name */}
            <div className="space-y-3">
              <Label
                htmlFor="customer-name-mobile"
                className="text-sm font-semibold text-stone-700"
              >
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customer-name-mobile"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="h-14 text-base bg-white border-stone-300 rounded-xl"
              />
            </div>

            {/* Order Type */}
            <div className="space-y-3">
              <Label
                htmlFor="order-type-mobile"
                className="text-sm font-semibold text-stone-700"
              >
                Order Type
              </Label>
              <Select
                value={orderType || 'pickup'}
                onValueChange={(value) => {
                  onOrderTypeChange(value as OrderType)
                  if (value === 'pickup' || value === 'dine_in') {
                    onDeliveryFeeChange(0)
                  }
                }}
              >
                <SelectTrigger
                  id="order-type-mobile"
                  className="h-14 text-base bg-white border-stone-300 w-full rounded-xl"
                >
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="dine_in">Dine In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Fee */}
            {orderType === 'delivery' && (
              <div className="space-y-3">
                <Label
                  htmlFor="delivery-fee-mobile"
                  className="text-sm font-semibold text-stone-700"
                >
                  Delivery Fee
                </Label>
                <Input
                  id="delivery-fee-mobile"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter delivery fee"
                  value={deliveryFee || ''}
                  onChange={(e) =>
                    onDeliveryFeeChange(Number(e.target.value) || 0)
                  }
                  className="h-14 text-base bg-white border-stone-300 rounded-xl"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-3">
              <Label
                htmlFor="payment-method-mobile"
                className="text-sm font-semibold text-stone-700"
              >
                Payment Method
              </Label>
              <Select
                value={paymentMethod || 'cash'}
                onValueChange={(value) =>
                  onPaymentMethodChange(value as PaymentMethod)
                }
              >
                <SelectTrigger
                  id="payment-method-mobile"
                  className="h-14 text-base bg-white border-stone-300 w-full rounded-xl"
                >
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label
                htmlFor="notes-mobile"
                className="text-sm font-semibold text-stone-700"
              >
                Additional Information
              </Label>
              <Textarea
                id="notes-mobile"
                placeholder="Enter any additional notes..."
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="min-h-[100px] text-base bg-white border-stone-300 resize-none rounded-xl"
                maxLength={500}
              />
              <p className="text-xs text-stone-500 text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-base font-medium">Cart is empty</p>
                <p className="text-sm text-stone-400 mt-2">
                  Add products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border-2 border-stone-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-stone-900">
                          {item.product_name}
                        </h4>
                        {item.variant_name && (
                          <p className="text-sm text-stone-600 mt-1">
                            {item.variant_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(index, -1)}
                          className="h-11 w-11 p-0 rounded-full border-2"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <span className="font-bold text-xl w-10 text-center text-stone-900">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(index, 1)}
                          className="h-11 w-11 p-0 rounded-full border-2"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                      <span className="font-bold text-xl text-stone-900">
                        ₱{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer - Fixed at bottom - Mobile App Style */}
          <div className="border-t-2 border-stone-200 px-8 py-5 space-y-4 bg-white safe-area-bottom rounded-t-3xl">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600 font-medium">Subtotal:</span>
                <span className="font-semibold text-stone-900">
                  ₱{itemsTotal.toFixed(2)}
                </span>
              </div>
              {orderType === 'delivery' && deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-600 font-medium">
                    Delivery Fee:
                  </span>
                  <span className="font-semibold text-stone-900">
                    ₱{deliveryFee.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-xl border-t-2 border-stone-200 pt-3">
              <span className="font-bold text-stone-900">Total:</span>
              <span className="font-bold text-2xl text-stone-900">
                ₱{total.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onClearCart()
                  setIsCartOpen(false)
                }}
                disabled={cart.length === 0 || isCreatingOrder}
                className="flex-1 h-14 text-base border-2 border-stone-300 rounded-xl font-semibold"
              >
                Clear
              </Button>
              <Button
                onClick={() => {
                  onCheckout()
                  setIsCartOpen(false)
                }}
                disabled={
                  cart.length === 0 || !customerName.trim() || isCreatingOrder
                }
                className="flex-1 h-14 text-base bg-stone-700 text-white hover:bg-stone-800 active:bg-stone-900 rounded-xl font-bold shadow-lg"
              >
                {isCreatingOrder ? 'Processing...' : 'Checkout'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Variant Selection Dialog */}
      {selectedProductForVariant && selectedProductData && (
        <VariantDialog
          open={showVariantDialog}
          onOpenChange={onShowVariantDialogChange}
          productName={selectedProductForVariant.productName}
          variants={selectedProductData.variants || []}
          basePrice={selectedProductData.price}
          onSelectVariant={handleVariantSelect}
          onSelectNoVariant={handleNoVariant}
        />
      )}
    </div>
  )
}
