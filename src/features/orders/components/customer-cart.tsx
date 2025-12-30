import { memo, useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { PaymentMethod } from '@/features/orders/types'

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  price: number
  subtotal: number
  add_ons?: Array<{ name: string; value: string; price?: number }>
}

interface AddOnProduct {
  id: string
  name: string
  price: number | null
}

interface CustomerCartProps {
  cart: CartItem[]
  customerName: string
  paymentMethod: PaymentMethod | null
  notes: string
  itemsTotal: number
  total: number
  isCreatingOrder: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCustomerNameChange: (name: string) => void
  onPaymentMethodChange: (method: PaymentMethod | null) => void
  onNotesChange: (notes: string) => void
  onQuantityUpdate: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  onCheckout: () => void
  variantAddOns?: Record<string, Array<{ name: string; value: string }>>
  addOnsProducts?: AddOnProduct[]
  onAddOnsUpdate?: (index: number, addOns: Array<{ name: string; value: string }>) => void
}

export const CustomerCart = memo(function CustomerCart({
  cart,
  customerName,
  paymentMethod,
  notes,
  itemsTotal,
  total,
  isCreatingOrder,
  isOpen,
  onOpenChange,
  onCustomerNameChange,
  onPaymentMethodChange,
  onNotesChange,
  onQuantityUpdate,
  onRemoveItem,
  onClearCart,
  onCheckout,
  variantAddOns = {},
  addOnsProducts = [],
  onAddOnsUpdate,
}: CustomerCartProps) {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const [expandedAddOns, setExpandedAddOns] = useState<Record<number, boolean>>({})

  const toggleAddOns = (index: number) => {
    setExpandedAddOns((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleAddOnToggle = (itemIndex: number, addOn: { name: string; value: string }) => {
    if (!onAddOnsUpdate) return
    
    const item = cart[itemIndex]
    const currentAddOns = item.add_ons || []
    const isSelected = currentAddOns.some(
      (a) => a.name === addOn.name && a.value === addOn.value
    )

    let newAddOns: Array<{ name: string; value: string }>
    if (isSelected) {
      newAddOns = currentAddOns.filter(
        (a) => !(a.name === addOn.name && a.value === addOn.value)
      )
    } else {
      newAddOns = [...currentAddOns, addOn]
    }

    onAddOnsUpdate(itemIndex, newAddOns)
  }

  const handleAddOnProductToggle = (itemIndex: number, product: AddOnProduct) => {
    if (!onAddOnsUpdate) return
    
    const item = cart[itemIndex]
    const currentAddOns = item.add_ons || []
    const isSelected = currentAddOns.some(
      (a) => a.name === 'Add-on' && a.value === product.name
    )

    let newAddOns: Array<{ name: string; value: string; price?: number }>
    if (isSelected) {
      newAddOns = currentAddOns.filter(
        (a) => !(a.name === 'Add-on' && a.value === product.name)
      )
    } else {
      newAddOns = [...currentAddOns, { 
        name: 'Add-on', 
        value: product.name,
        price: product.price || 0
      }]
    }

    onAddOnsUpdate(itemIndex, newAddOns)
  }

  // Calculate item subtotal including add-ons
  const calculateItemSubtotal = (item: CartItem) => {
    const baseSubtotal = item.subtotal
    const addOnsTotal = (item.add_ons || []).reduce((sum, addOn) => {
      return sum + (addOn.price || 0) * item.quantity
    }, 0)
    return baseSubtotal + addOnsTotal
  }

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => onOpenChange(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-stone-700 text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-stone-800 transition-colors flex items-center gap-2"
        aria-label="Open cart"
      >
        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
        {cartItemCount > 0 && (
          <span className="bg-white text-stone-700 rounded-full px-2 py-1 text-xs font-bold min-w-[20px] sm:min-w-[24px] text-center">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </button>

      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[400px] overflow-y-auto flex flex-col p-0">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-stone-200">
            <SheetTitle className="text-lg sm:text-xl font-bold text-stone-900">
              Your Order
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-xs sm:text-sm font-medium text-stone-700">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customer-name"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="h-10 sm:h-12 text-sm sm:text-base bg-white border-stone-300"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-xs sm:text-sm font-medium text-stone-700">
                Payment Method
              </Label>
              <Select
                value={paymentMethod || 'cash'}
                onValueChange={(value) =>
                  onPaymentMethodChange(value as PaymentMethod)
                }
              >
                <SelectTrigger
                  id="payment-method"
                  className="h-10 sm:h-12 text-sm sm:text-base bg-white border-stone-300 w-full"
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
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm font-medium text-stone-700">
                Additional Information
              </Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes or information..."
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="min-h-[80px] text-sm sm:text-base bg-white border-stone-300 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-stone-500 text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Cart Items Section */}
            {cart.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm sm:text-base font-semibold text-stone-900 mb-3 sm:mb-4">
                  Items ({cart.length})
                </h3>
              </div>
            )}

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-stone-500">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {cart.map((item, index) => {
                  const availableVariantAddOns = item.variant_id ? variantAddOns[item.variant_id] || [] : []
                  const hasVariantAddOns = availableVariantAddOns.length > 0
                  const hasAddOnsProducts = addOnsProducts.length > 0
                  const hasAddOns = hasVariantAddOns || hasAddOnsProducts
                  const isAddOnsExpanded = expandedAddOns[index] || false
                  const selectedAddOns = item.add_ons || []

                  return (
                    <div
                      key={index}
                      className="bg-stone-50 rounded-lg p-3 sm:p-4 border border-stone-200"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm truncate">{item.product_name}</h4>
                          {item.variant_name && (
                            <p className="text-[10px] sm:text-xs text-stone-600 truncate">{item.variant_name}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(index)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>

                      {/* Add-ons Section */}
                      {hasAddOns && (
                        <div className="mb-2 sm:mb-3 border-t border-stone-200 pt-2 mt-2">
                          <button
                            onClick={() => toggleAddOns(index)}
                            className="w-full flex items-center justify-between text-xs sm:text-sm text-stone-700 hover:text-stone-900 transition-colors py-1.5 px-1 rounded hover:bg-stone-100"
                          >
                            <span className="font-semibold">
                              Customize with Add-ons {selectedAddOns.length > 0 && (
                                <span className="text-stone-600 font-normal">
                                  ({selectedAddOns.length} selected)
                                </span>
                              )}
                            </span>
                            {isAddOnsExpanded ? (
                              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                          {isAddOnsExpanded && (
                            <div className="mt-3 space-y-4 pl-3 border-l-2 border-stone-300">
                              {/* Variant Options */}
                              {hasVariantAddOns && (
                                <div className="space-y-2.5">
                                  <div className="text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
                                    Options
                                  </div>
                                  {availableVariantAddOns.map((addOn, addOnIndex) => {
                                    const isSelected = selectedAddOns.some(
                                      (a) => a.name === addOn.name && a.value === addOn.value
                                    )
                                    return (
                                      <div
                                        key={`variant-${addOnIndex}`}
                                        className="flex items-center gap-2.5 p-1.5 rounded hover:bg-stone-50 transition-colors"
                                      >
                                        <Checkbox
                                          id={`addon-${index}-variant-${addOnIndex}`}
                                          checked={isSelected}
                                          onCheckedChange={() => handleAddOnToggle(index, addOn)}
                                          className="h-4 w-4 sm:h-5 sm:w-5"
                                        />
                                        <label
                                          htmlFor={`addon-${index}-variant-${addOnIndex}`}
                                          className="text-xs sm:text-sm text-stone-700 cursor-pointer flex-1"
                                        >
                                          <span className="font-medium">{addOn.name}:</span>{' '}
                                          <span className="text-stone-600">{addOn.value}</span>
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              {/* Add-on Products */}
                              {hasAddOnsProducts && (
                                <div className="space-y-2.5">
                                  {hasVariantAddOns && (
                                    <div className="text-xs sm:text-sm font-semibold text-stone-800 mb-1.5 pt-2 border-t border-stone-200">
                                      Additional Add-ons
                                    </div>
                                  )}
                                  {!hasVariantAddOns && (
                                    <div className="text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
                                      Available Add-ons
                                    </div>
                                  )}
                                  {addOnsProducts.map((product) => {
                                    const isSelected = selectedAddOns.some(
                                      (a) => a.name === 'Add-on' && a.value === product.name
                                    )
                                    const addOnPrice = product.price || 0
                                    return (
                                      <div
                                        key={product.id}
                                        className="flex items-center justify-between gap-2.5 p-1.5 rounded hover:bg-stone-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5 flex-1">
                                          <Checkbox
                                            id={`addon-${index}-product-${product.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => handleAddOnProductToggle(index, product)}
                                            className="h-4 w-4 sm:h-5 sm:w-5"
                                          />
                                          <label
                                            htmlFor={`addon-${index}-product-${product.id}`}
                                            className="text-xs sm:text-sm text-stone-700 cursor-pointer flex-1"
                                          >
                                            <span className="font-medium">{product.name}</span>
                                          </label>
                                        </div>
                                        {addOnPrice > 0 && (
                                          <span className="text-xs sm:text-sm font-semibold text-stone-900 whitespace-nowrap">
                                            +₱{addOnPrice.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {selectedAddOns.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <div className="text-[10px] sm:text-xs font-medium text-stone-600 mb-1">
                                Selected:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedAddOns.map((addOn, addOnIndex) => (
                                  <Badge
                                    key={addOnIndex}
                                    variant="secondary"
                                    className="text-[9px] sm:text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5"
                                  >
                                    {addOn.name}: {addOn.value}
                                    {addOn.price !== undefined && addOn.price > 0 && (
                                      <span className="ml-1 font-semibold">
                                        +₱{(addOn.price * item.quantity).toFixed(2)}
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-200">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityUpdate(index, -1)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="font-semibold w-6 sm:w-8 text-center text-xs sm:text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onQuantityUpdate(index, 1)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            ₱{calculateItemSubtotal(item).toFixed(2)}
                          </span>
                          {selectedAddOns.length > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-stone-500">
                              Base: ₱{item.subtotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-stone-200 px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 bg-stone-50 sticky bottom-0 mt-auto">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-medium">₱{itemsTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-base sm:text-lg border-t border-stone-300 pt-3 sm:pt-4">
                <span className="font-semibold text-stone-900">Total:</span>
                <span className="font-bold text-lg sm:text-xl text-stone-900">₱{total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={onClearCart}
                  disabled={cart.length === 0 || isCreatingOrder}
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base border-stone-300"
                >
                  Clear
                </Button>
                <Button
                  onClick={onCheckout}
                  disabled={
                    cart.length === 0 ||
                    !customerName.trim() ||
                    isCreatingOrder
                  }
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base bg-stone-700 text-white hover:bg-stone-800"
                >
                  {isCreatingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
})

