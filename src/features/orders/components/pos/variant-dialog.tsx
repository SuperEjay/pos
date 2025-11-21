import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface VariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  variants: Array<{
    id: string
    name: string
    price: number | null
    options?: Array<{ name: string; value: string }>
  }>
  basePrice: number | null
  onSelectVariant: (variant: any) => void
  onSelectNoVariant: () => void
}

export function VariantDialog({
  open,
  onOpenChange,
  productName,
  variants,
  basePrice,
  onSelectVariant,
  onSelectNoVariant,
}: VariantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Variant</DialogTitle>
          <DialogDescription>
            Choose a variant for {productName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => onSelectVariant(variant)}
              className="w-full text-left p-4 rounded-lg border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{variant.name}</h4>
                  {variant.options && variant.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {variant.options.map((opt, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {opt.name}: {opt.value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-bold text-lg">
                  ₱{variant.price ? Number(variant.price).toFixed(2) : '0.00'}
                </span>
              </div>
            </button>
          ))}
          <button
            onClick={onSelectNoVariant}
            className="w-full text-left p-4 rounded-lg border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">No variant</h4>
                <p className="text-sm text-stone-600">Use base product price</p>
              </div>
              <span className="font-bold text-lg">
                ₱{basePrice ? Number(basePrice).toFixed(2) : '0.00'}
              </span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

