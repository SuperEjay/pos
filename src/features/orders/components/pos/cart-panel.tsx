import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
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

interface CartPanelProps {
  cart: CartItem[]
  customerName: string
  paymentMethod: PaymentMethod | null
  notes: string
  total: number
  isCreatingOrder: boolean
  onCustomerNameChange: (name: string) => void
  onPaymentMethodChange: (method: PaymentMethod | null) => void
  onNotesChange: (notes: string) => void
  onQuantityUpdate: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  onCheckout: () => void
}

export function CartPanel({
  cart,
  customerName,
  paymentMethod,
  notes,
  total,
  isCreatingOrder,
  onCustomerNameChange,
  onPaymentMethodChange,
  onNotesChange,
  onQuantityUpdate,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartPanelProps) {
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
            {cart.map((item, index) => (
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
                <div className="flex items-center justify-between">
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
                  <span className="font-bold text-stone-900">
                    ₱{item.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="border-t border-stone-200 p-4 space-y-3 bg-stone-50">
        <div className="flex justify-between items-center text-lg">
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
}

