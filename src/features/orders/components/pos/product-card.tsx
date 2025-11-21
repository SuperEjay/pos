import { Badge } from '@/components/ui/badge'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number | null
    category_name?: string | null
    variants_count?: number
  }
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-stone-200 p-4 hover:border-stone-400 hover:shadow-md transition-all text-left group"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-base group-hover:text-stone-700">
          {product.name}
        </h3>
        {product.category_name && (
          <Badge variant="outline" className="text-xs">
            {product.category_name}
          </Badge>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-stone-900">
            ₱{product.price ? Number(product.price).toFixed(2) : '0.00'}
          </span>
          {product.variants_count && product.variants_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {product.variants_count} variants
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

