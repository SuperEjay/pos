import { memo, useMemo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductCard } from './product-card'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: Array<{
    id: string
    name: string
    price: number | null
    category_id: string
    category_name?: string | null
    variants_count?: number
    is_active: boolean
  }>
  categories: Array<{ id: string; name: string }> | undefined
  selectedCategory: string | null
  searchQuery: string
  onCategoryChange: (categoryId: string | null) => void
  onSearchChange: (query: string) => void
  onProductClick: (product: any) => void
}

export const ProductGrid = memo(function ProductGrid({
  products,
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  onProductClick,
}: ProductGridProps) {
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

  const handleCategoryClick = useCallback(
    (categoryId: string | null) => {
      onCategoryChange(categoryId)
    },
    [onCategoryChange],
  )

  const handleProductClick = useCallback(
    (product: any) => {
      onProductClick(product)
    },
    [onProductClick],
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search and Category Filter */}
      <div className="bg-white border-b border-stone-200 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-lg bg-white border-stone-300"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleCategoryClick(null)}
            className={cn(
              'min-w-[120px] h-12 text-base',
              selectedCategory === null &&
                'bg-stone-700 text-white hover:bg-stone-800',
            )}
          >
            All
          </Button>
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="lg"
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'min-w-[120px] h-12 text-base whitespace-nowrap',
                selectedCategory === category.id &&
                  'bg-stone-700 text-white hover:bg-stone-800',
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>

        {filteredProducts?.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <p className="text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
})

