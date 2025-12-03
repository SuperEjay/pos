import { memo } from 'react'
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

export const ProductCard = memo(function ProductCard({
  product,
  onClick,
}: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-stone-200 p-4 hover:border-stone-400 active:border-stone-500 hover:shadow-md active:shadow-sm transition-all text-left group touch-manipulation min-h-[120px] flex flex-col justify-between"
    >
      <div className="space-y-2 flex-1">
        <h3 className="font-semibold text-sm md:text-base lg:text-lg group-hover:text-stone-700 line-clamp-2">
          {product.name}
        </h3>
        {product.category_name && (
          <Badge variant="outline" className="text-xs hidden md:inline-flex">
            {product.category_name}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 mt-auto">
        <span className="text-sm md:text-base lg:text-lg font-bold text-stone-900">
          ₱{product.price ? Number(product.price).toFixed(2) : '0.00'}
        </span>
        {product.variants_count && product.variants_count > 0 && (
          <Badge variant="secondary" className="text-xs">
            {product.variants_count} variants
          </Badge>
        )}
      </div>
    </button>
  )
})

