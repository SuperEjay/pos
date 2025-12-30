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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { PaymentMethod, OrderType } from '@/features/orders/types'

interface CartItem {
  product_id: string
  product_name: string
  variant_id: string | null
  variant_name: string | null
  quantity: number
  price: number
  subtotal: number
  add_ons?: Array<{ name: string; value: string; price?: number; quantity?: number }>
}

interface AddOnProduct {
  id: string
  name: string
  price: number | null
}

interface CartPanelProps {
  cart: CartItem[]
  customerName: string
  orderType: OrderType | null
  deliveryFee: number
  paymentMethod: PaymentMethod | null
  notes: string
  itemsTotal: number
  total: number
  isCreatingOrder: boolean
  onCustomerNameChange: (name: string) => void
  onOrderTypeChange: (type: OrderType | null) => void
  onDeliveryFeeChange: (fee: number) => void
  onPaymentMethodChange: (method: PaymentMethod | null) => void
  onNotesChange: (notes: string) => void
  onQuantityUpdate: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  onCheckout: () => void
  variantAddOns?: Record<string, Array<{ name: string; value: string }>>
  addOnsProducts?: AddOnProduct[]
  onAddOnsUpdate?: (index: number, addOns: Array<{ name: string; value: string; price?: number; quantity?: number }>) => void
}

export const CartPanel = memo(function CartPanel({
  cart,
  customerName,
  orderType,
  deliveryFee,
  paymentMethod,
  notes,
  itemsTotal,
  total,
  isCreatingOrder,
  onCustomerNameChange,
  onOrderTypeChange,
  onDeliveryFeeChange,
  onPaymentMethodChange,
  onNotesChange,
  onQuantityUpdate,
  onRemoveItem,
  onClearCart,
  onCheckout,
  variantAddOns = {},
  addOnsProducts = [],
  onAddOnsUpdate,
}: CartPanelProps) {
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
    const existingAddOnIndex = currentAddOns.findIndex(
      (a) => a.name === addOn.name && a.value === addOn.value
    )

    let newAddOns: Array<{ name: string; value: string; price?: number; quantity?: number }>
    if (existingAddOnIndex >= 0) {
      const existingAddOn = currentAddOns[existingAddOnIndex]
      if (existingAddOn.quantity === 0 || !existingAddOn.quantity) {
        newAddOns = currentAddOns.filter(
          (a) => !(a.name === addOn.name && a.value === addOn.value)
        )
      } else {
        newAddOns = [...currentAddOns]
      }
    } else {
      newAddOns = [...currentAddOns, { ...addOn, quantity: 1 }]
    }

    onAddOnsUpdate(itemIndex, newAddOns)
  }

  const handleAddOnProductToggle = (itemIndex: number, product: AddOnProduct) => {
    if (!onAddOnsUpdate) return
    
    const item = cart[itemIndex]
    const currentAddOns = item.add_ons || []
    const existingAddOnIndex = currentAddOns.findIndex(
      (a) => a.name === 'Add-on' && a.value === product.name
    )

    let newAddOns: Array<{ name: string; value: string; price?: number; quantity?: number }>
    if (existingAddOnIndex >= 0) {
      const existingAddOn = currentAddOns[existingAddOnIndex]
      if (existingAddOn.quantity === 0 || !existingAddOn.quantity) {
        newAddOns = currentAddOns.filter(
          (a) => !(a.name === 'Add-on' && a.value === product.name)
        )
      } else {
        newAddOns = [...currentAddOns]
      }
    } else {
      newAddOns = [...currentAddOns, { 
        name: 'Add-on', 
        value: product.name,
        price: product.price || 0,
        quantity: 1
      }]
    }

    onAddOnsUpdate(itemIndex, newAddOns)
  }

  const handleAddOnQuantityChange = (
    itemIndex: number,
    addOnName: string,
    addOnValue: string,
    delta: number
  ) => {
    if (!onAddOnsUpdate) return

    const item = cart[itemIndex]
    const currentAddOns = item.add_ons || []
    const addOnIndex = currentAddOns.findIndex(
      (a) => a.name === addOnName && a.value === addOnValue
    )

    if (addOnIndex >= 0) {
      const newAddOns = [...currentAddOns]
      const currentQuantity = newAddOns[addOnIndex].quantity || 1
      const newQuantity = Math.max(0, currentQuantity + delta)

      if (newQuantity === 0) {
        newAddOns.splice(addOnIndex, 1)
      } else {
        newAddOns[addOnIndex] = {
          ...newAddOns[addOnIndex],
          quantity: newQuantity
        }
      }

      onAddOnsUpdate(itemIndex, newAddOns)
    }
  }

  // Calculate item subtotal including add-ons
  const calculateItemSubtotal = (item: CartItem) => {
    const baseSubtotal = item.subtotal
    const addOnsTotal = (item.add_ons || []).reduce((sum, addOn) => {
      const addOnQuantity = addOn.quantity || 1
      return sum + (addOn.price || 0) * addOnQuantity * item.quantity
    }, 0)
    return baseSubtotal + addOnsTotal
  }
  return (
    <div className="w-full md:w-96 lg:w-[400px] bg-white border-l border-stone-200 flex flex-col">
      <div className="p-4 border-b border-stone-200">
        <h2 className="text-xl font-bold text-stone-900">Cart</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="text-sm font-medium text-stone-700">
            Customer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-name"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="h-12 text-base bg-white border-stone-300"
          />
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label htmlFor="order-type" className="text-sm font-medium text-stone-700">
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
              id="order-type"
              className="h-12 text-base bg-white border-stone-300 w-full"
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

        {/* Delivery Fee - Only show when order type is delivery */}
        {orderType === 'delivery' && (
          <div className="space-y-2">
            <Label htmlFor="delivery-fee" className="text-sm font-medium text-stone-700">
              Delivery Fee
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter delivery fee"
              value={deliveryFee || ''}
              onChange={(e) => onDeliveryFeeChange(Number(e.target.value) || 0)}
              className="h-12 text-base bg-white border-stone-300"
            />
          </div>
        )}

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment-method" className="text-sm font-medium text-stone-700">
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
              className="h-12 text-base bg-white border-stone-300 w-full"
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
          <Label htmlFor="notes" className="text-sm font-medium text-stone-700">
            Additional Information
          </Label>
          <Textarea
            id="notes"
            placeholder="Enter any additional notes or information..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[80px] text-base bg-white border-stone-300 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-stone-500 text-right">
            {notes.length}/500
          </p>
        </div>

        {/* Cart Items */}
        {cart.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  className="bg-stone-50 rounded-lg p-3 border border-stone-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.product_name}</h4>
                      {item.variant_name && (
                        <p className="text-xs text-stone-600">{item.variant_name}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Add-ons Section */}
                  {hasAddOns && (
                    <div className="mb-2 border-t border-stone-200 pt-2 mt-2">
                      <button
                        onClick={() => toggleAddOns(index)}
                        className="w-full flex items-center justify-between text-sm text-stone-700 hover:text-stone-900 transition-colors py-1.5 px-1 rounded hover:bg-stone-100"
                      >
                        <span className="font-semibold">
                          Customize with Add-ons {selectedAddOns.length > 0 && (
                            <span className="text-stone-600 font-normal">
                              ({selectedAddOns.reduce((sum, a) => sum + (a.quantity || 1), 0)} items)
                            </span>
                          )}
                        </span>
                        {isAddOnsExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {isAddOnsExpanded && (
                        <div className="mt-3 space-y-4 pl-3 border-l-2 border-stone-300">
                          {/* Variant Options */}
                          {hasVariantAddOns && (
                            <div className="space-y-2.5">
                              <div className="text-sm font-semibold text-stone-800 mb-1.5">
                                Options
                              </div>
                              {availableVariantAddOns.map((addOn, addOnIndex) => {
                                const selectedAddOn = selectedAddOns.find(
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
                                      id={`addon-${index}-variant-${addOnIndex}`}
                                      checked={isSelected}
                                      onCheckedChange={() => handleAddOnToggle(index, addOn)}
                                      className="h-4 w-4"
                                    />
                                    <label
                                      htmlFor={`addon-${index}-variant-${addOnIndex}`}
                                      className="text-sm text-stone-700 cursor-pointer flex-1"
                                    >
                                      <span className="font-medium">{addOn.name}:</span>{' '}
                                      <span className="text-stone-600">{addOn.value}</span>
                                    </label>
                                    {isSelected && (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAddOnQuantityChange(index, addOn.name, addOn.value, -1)
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="text-sm font-semibold w-6 text-center">
                                          {quantity}
                                        </span>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleAddOnQuantityChange(index, addOn.name, addOn.value, 1)
                                          }}
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
                          {hasAddOnsProducts && (
                            <div className="space-y-2.5">
                              {hasVariantAddOns && (
                                <div className="text-sm font-semibold text-stone-800 mb-1.5 pt-2 border-t border-stone-200">
                                  Additional Add-ons
                                </div>
                              )}
                              {!hasVariantAddOns && (
                                <div className="text-sm font-semibold text-stone-800 mb-1.5">
                                  Available Add-ons
                                </div>
                              )}
                              {addOnsProducts.map((product) => {
                                const selectedAddOn = selectedAddOns.find(
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
                                        id={`addon-${index}-product-${product.id}`}
                                        checked={isSelected}
                                        onCheckedChange={() => handleAddOnProductToggle(index, product)}
                                        className="h-4 w-4"
                                      />
                                      <label
                                        htmlFor={`addon-${index}-product-${product.id}`}
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
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAddOnQuantityChange(index, 'Add-on', product.name, -1)
                                            }}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Minus className="w-3 h-3" />
                                          </Button>
                                          <span className="text-sm font-semibold w-6 text-center">
                                            {quantity}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAddOnQuantityChange(index, 'Add-on', product.name, 1)
                                            }}
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
                        </div>
                      )}
                      {selectedAddOns.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs font-medium text-stone-600 mb-1">
                            Selected:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedAddOns.map((addOn, addOnIndex) => {
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
                                      +₱{(addOn.price * addOnQuantity * item.quantity).toFixed(2)}
                                    </span>
                                  )}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityUpdate(index, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuantityUpdate(index, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-stone-900">
                        ₱{calculateItemSubtotal(item).toFixed(2)}
                      </span>
                      {selectedAddOns.length > 0 && (
                        <span className="text-xs text-stone-500">
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
      <div className="border-t border-stone-200 p-4 space-y-3 bg-stone-50">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal:</span>
            <span className="font-medium">₱{itemsTotal.toFixed(2)}</span>
          </div>
          {orderType === 'delivery' && deliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Delivery Fee:</span>
              <span className="font-medium">₱{deliveryFee.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-lg border-t pt-2">
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-xl">₱{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClearCart}
            disabled={cart.length === 0 || isCreatingOrder}
            className="flex-1 h-12 text-base border-stone-300"
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
            className="flex-1 h-12 text-base bg-stone-700 text-white hover:bg-stone-800"
          >
            {isCreatingOrder ? 'Processing...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </div>
  )
})

