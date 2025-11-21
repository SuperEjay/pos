import { useState, useMemo, useCallback } from 'react'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useGetProducts } from '@/features/products/hooks'
import { useGetCategories } from '@/features/categories/hooks'
import { useAddOrder } from '../hooks'
import { getProduct } from '@/features/products/services/products.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { PaymentMethod, OrderType } from '@/features/orders/types'
import { ProductGrid } from './pos/product-grid'
import { CartPanel } from './pos/cart-panel'
import { VariantDialog } from './pos/variant-dialog'

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  price: number
  subtotal: number
}

export function POSInterface() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<OrderType | null>('pickup')
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('cash')
  const [notes, setNotes] = useState('')
  const [productsWithVariants, setProductsWithVariants] = useState<
    Record<string, any>
  >({})
  const [showVariantDialog, setShowVariantDialog] = useState(false)
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<{
    productId: string
    productName: string
  } | null>(null)

  const { data: products } = useGetProducts()
  const { data: categories } = useGetCategories()
  const { mutate: createOrder, isPending: isCreatingOrder } = useAddOrder()

  // Fetch product with variants
  const fetchProductVariants = useCallback(
    async (productId: string) => {
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
    },
    [productsWithVariants],
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
      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex(
          (item) =>
            item.product_id === productId &&
            item.variant_id === variantId,
        )

        if (existingItemIndex >= 0) {
          // Update quantity
          const newCart = [...prevCart]
          newCart[existingItemIndex].quantity += 1
          newCart[existingItemIndex].subtotal =
            newCart[existingItemIndex].quantity *
            newCart[existingItemIndex].price
          return newCart
        } else {
          // Add new item
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
    },
    [],
  )

  // Add product to cart
  const handleAddToCart = useCallback(
    async (product: any) => {
      const productData = await fetchProductVariants(product.id)
      const variants = productData?.variants || []

      if (variants.length > 0) {
        // Show variant selection dialog
        setSelectedProductForVariant({
          productId: product.id,
          productName: product.name,
        })
        setShowVariantDialog(true)
      } else {
        // Add directly to cart
        addToCart(product.id, product.name, null, null, product.price || 0)
      }
    },
    [fetchProductVariants, addToCart],
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
        setShowVariantDialog(false)
        setSelectedProductForVariant(null)
      }
    },
    [selectedProductForVariant, productsWithVariants, addToCart],
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
      setShowVariantDialog(false)
      setSelectedProductForVariant(null)
    }
  }, [selectedProductForVariant, productsWithVariants, addToCart])

  // Update cart item quantity
  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart]
      newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
      newCart[index].subtotal =
        newCart[index].quantity * newCart[index].price
      return newCart
    })
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback((index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index))
  }, [])

  // Calculate total (items + delivery fee if delivery)
  const itemsTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart],
  )
  const total = useMemo(
    () => itemsTotal + (orderType === 'delivery' ? deliveryFee : 0),
    [itemsTotal, orderType, deliveryFee],
  )

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const orderData = {
      customer_name: customerName.trim(),
      status: 'pending' as const,
      order_date: new Date().toISOString().split('T')[0],
      order_type: orderType,
      delivery_fee: orderType === 'delivery' ? deliveryFee : null,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
      items: cart.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    createOrder(orderData, {
      onSuccess: () => {
        toast.success('Order created successfully!')
        setCart([])
        setCustomerName('')
        setOrderType('pickup')
        setDeliveryFee(0)
        setPaymentMethod('cash')
        setNotes('')
      },
    })
  }, [customerName, cart, orderType, deliveryFee, paymentMethod, notes, createOrder])

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const selectedProductData = useMemo(
    () =>
      selectedProductForVariant
        ? productsWithVariants[selectedProductForVariant.productId]
        : null,
    [selectedProductForVariant, productsWithVariants],
  )

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: '/orders' })}
              className="h-12 px-4 border-stone-300 hover:bg-stone-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Point of Sale</h1>
              <p className="text-sm text-stone-600">Create new orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <ShoppingCart className="w-5 h-5 mr-2" />
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <ProductGrid
          products={products || []}
          categories={categories}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          onProductClick={handleAddToCart}
        />

        {/* Cart Section */}
        <CartPanel
          cart={cart}
          customerName={customerName}
          orderType={orderType}
          deliveryFee={deliveryFee}
          paymentMethod={paymentMethod}
          notes={notes}
          itemsTotal={itemsTotal}
          total={total}
          isCreatingOrder={isCreatingOrder}
          onCustomerNameChange={setCustomerName}
          onOrderTypeChange={setOrderType}
          onDeliveryFeeChange={setDeliveryFee}
          onPaymentMethodChange={setPaymentMethod}
          onNotesChange={setNotes}
          onQuantityUpdate={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Variant Selection Dialog */}
      {selectedProductForVariant && selectedProductData && (
        <VariantDialog
          open={showVariantDialog}
          onOpenChange={setShowVariantDialog}
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
