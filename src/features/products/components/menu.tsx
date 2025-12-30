import { useState, useMemo, useCallback } from 'react'
import { useGetMenuProducts } from '../hooks/useMenu'
import { getProduct } from '../services/products.service'
import { useAddOrder } from '@/features/orders/hooks/useOrder'
import { CustomerCart } from '@/features/orders/components/customer-cart'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/features/orders/types'

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  price: number
  subtotal: number
}

export default function Menu() {
  const { data: categories, isLoading } = useGetMenuProducts()
  const { mutate: addOrder, isPending: isCreatingOrder } = useAddOrder()
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    name: string
    variants: Array<{
      id: string
      name: string
      price: number | null
      options?: Array<{ name: string; value: string }>
    }>
    basePrice: number | null
  } | null>(null)
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [productsWithVariants, setProductsWithVariants] = useState<
    Record<string, any>
  >({})
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('cash')
  const [notes, setNotes] = useState('')

  // Determine which category to show
  const activeCategoryId = useMemo(() => {
    if (selectedCategory) return selectedCategory
    if (categories && categories.length > 0) return categories[0].id
    return null
  }, [selectedCategory, categories])

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!categories || !activeCategoryId) return []
    const category = categories.find((cat) => cat.id === activeCategoryId)
    return category?.products || []
  }, [categories, activeCategoryId])

  // Calculate price range for products with variants
  const getPriceRange = useCallback(
    (product: {
      price: number | null
      variants: Array<{ price: number | null }>
    }) => {
      if (product.variants.length === 0) {
        return product.price !== null ? `₱${product.price.toFixed(2)}` : 'Price not available'
      }

      const prices = product.variants
        .map((v) => v.price)
        .filter((p): p is number => p !== null)

      if (prices.length === 0) {
        return 'Price not available'
      }

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      if (minPrice === maxPrice) {
        return `₱${minPrice.toFixed(2)}`
      }

      return `₱${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`
    },
    [],
  )

  // Add to cart
  const addToCart = useCallback(
    (
      productId: string,
      productName: string,
      variantId: string | null,
      variantName: string | null,
      price: number,
    ) => {
      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex(
          (item) =>
            item.product_id === productId && item.variant_id === variantId,
        )

        if (existingItemIndex >= 0) {
          const newCart = [...prevCart]
          newCart[existingItemIndex].quantity += 1
          newCart[existingItemIndex].subtotal =
            newCart[existingItemIndex].quantity *
            newCart[existingItemIndex].price
          return newCart
        } else {
          return [
            ...prevCart,
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
      })
      setIsCartOpen(true)
      toast.success('Added to cart')
    },
    [],
  )

  // Update quantity
  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart]
      newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
      newCart[index].subtotal =
        newCart[index].quantity * newCart[index].price
      return newCart
    })
  }, [])

  // Remove item
  const removeFromCart = useCallback((index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index))
  }, [])

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([])
    setCustomerName('')
    setPaymentMethod('cash')
    setNotes('')
  }, [])

  // Calculate totals
  const itemsTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart],
  )
  const total = useMemo(
    () => itemsTotal,
    [itemsTotal],
  )

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || !customerName.trim()) {
      toast.error('Please add items to cart and enter your name')
      return
    }

    const orderDate = new Date().toISOString().split('T')[0]

    addOrder(
      {
        customer_name: customerName.trim(),
        status: 'pending',
        order_date: orderDate,
        order_type: 'dine_in',
        delivery_fee: null,
        payment_method: paymentMethod || 'cash',
        notes: notes.trim() || null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Order placed successfully!')
          clearCart()
          setIsCartOpen(false)
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to place order')
        },
      },
    )
  }, [cart, customerName, paymentMethod, notes, addOrder, clearCart])

  // Handle product click
  const handleProductClick = useCallback(
    async (product: {
      id: string
      name: string
      price: number | null
      variants: Array<{ id: string; name: string; price: number | null }>
    }) => {
      // If product has variants, fetch full product data and show dialog
      if (product.variants.length > 0) {
        let productData = productsWithVariants[product.id]

        if (!productData) {
          try {
            productData = await getProduct(product.id)
            setProductsWithVariants((prev) => ({
              ...prev,
              [product.id]: productData,
            }))
          } catch (error) {
            console.error('Failed to fetch product variants:', error)
            return
          }
        }

        setSelectedProduct({
          id: product.id,
          name: product.name,
          variants: productData.variants || [],
          basePrice: productData.price,
        })
        setShowVariantDialog(true)
      } else {
        // If no variants, add directly to cart
        const price = product.price || 0
        if (price > 0) {
          addToCart(product.id, product.name, null, null, price)
        } else {
          toast.error('Product price not available')
        }
      }
    },
    [productsWithVariants, addToCart],
  )

  // Handle variant selection
  const handleVariantSelect = useCallback(
    (variant: { id: string; name: string; price: number | null }) => {
      if (selectedProduct) {
        const variantPrice = variant.price || selectedProduct.basePrice || 0
        addToCart(
          selectedProduct.id,
          selectedProduct.name,
          variant.id,
          variant.name,
          variantPrice,
        )
        setShowVariantDialog(false)
        setSelectedProduct(null)
      }
    },
    [selectedProduct, addToCart],
  )

  // Handle base product selection (no variant)
  const handleBaseProductSelect = useCallback(() => {
    if (selectedProduct && selectedProduct.basePrice !== null) {
      addToCart(
        selectedProduct.id,
        selectedProduct.name,
        null,
        null,
        selectedProduct.basePrice,
      )
      setShowVariantDialog(false)
      setSelectedProduct(null)
    }
  }, [selectedProduct, addToCart])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 mb-6 sm:mb-8 gap-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2 sm:gap-4 overflow-x-auto w-full sm:w-auto">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-20 sm:w-24 flex-shrink-0" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 sm:h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20 sm:pb-6">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4">
        {/* Header with Logo and Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 mb-6 sm:mb-8 border-b border-stone-200 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/deja-bros-logo.png"
              alt="Deja Bros Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Deja Bros</h1>
          </div>

          {/* Category Navigation Tabs */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
              {categories.map((category) => {
                const isSelected = activeCategoryId === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'relative pb-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                      isSelected
                        ? 'text-stone-900'
                        : 'text-stone-500 hover:text-stone-700'
                    )}
                  >
                    {category.name}
                    {isSelected && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-700" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => {
              const hasVariants = product.variants.length > 0
              const priceDisplay = getPriceRange(product)

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-stone-50 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all text-left group flex flex-col"
                >
                  {/* Circular Product Image */}
                  <div className="w-full aspect-square mb-2 sm:mb-3 flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center">
                      <img
                        src="/deja-bros-logo.png"
                        alt={product.name}
                        className="h-full w-full object-contain p-2 sm:p-3 md:p-4"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-sm sm:text-base text-black mb-1 sm:mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto gap-1">
                      <span className="text-xs sm:text-sm md:text-base font-bold text-stone-900 truncate">
                        {priceDisplay}
                      </span>
                      {hasVariants && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs bg-stone-200 text-stone-700 flex-shrink-0">
                          Variants
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-stone-600 text-base sm:text-lg">No products available in this category.</p>
          </div>
        )}

        {/* Variant Selection Dialog */}
        {selectedProduct && (
          <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Select Variant</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Choose a variant for {selectedProduct.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                {selectedProduct.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className="w-full text-left p-3 sm:p-4 rounded-lg border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base">{variant.name}</h4>
                        {variant.options && variant.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {variant.options.map((opt, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs">
                                {opt.name}: {opt.value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-base sm:text-lg text-stone-900 flex-shrink-0">
                        ₱{variant.price ? Number(variant.price).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </button>
                ))}
                {selectedProduct.basePrice !== null && (
                  <button
                    onClick={handleBaseProductSelect}
                    className="w-full text-left p-3 sm:p-4 rounded-lg border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base">Base Product</h4>
                        <p className="text-xs sm:text-sm text-stone-600">Use base product price</p>
                      </div>
                      <span className="font-bold text-base sm:text-lg text-stone-900 flex-shrink-0">
                        ₱{Number(selectedProduct.basePrice).toFixed(2)}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Customer Cart */}
        <CustomerCart
          cart={cart}
          customerName={customerName}
          paymentMethod={paymentMethod}
          notes={notes}
          itemsTotal={itemsTotal}
          total={total}
          isCreatingOrder={isCreatingOrder}
          isOpen={isCartOpen}
          onOpenChange={setIsCartOpen}
          onCustomerNameChange={setCustomerName}
          onPaymentMethodChange={setPaymentMethod}
          onNotesChange={setNotes}
          onQuantityUpdate={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}
