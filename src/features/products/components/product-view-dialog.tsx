import { useEffect } from 'react'
import { EyeIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetProduct } from '../hooks'
import { useGetCategories } from '@/features/categories/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

interface ProductViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
}

export function ProductViewDialog({
  open,
  onOpenChange,
  productId,
}: ProductViewDialogProps) {
  const queryClient = useQueryClient()
  const { data: product, isLoading } = useGetProduct(productId)
  const { data: categories } = useGetCategories()

  // Invalidate and refetch product data when dialog opens
  useEffect(() => {
    if (open && productId) {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    }
  }, [open, productId, queryClient])

  const categoryName =
    categories?.find((cat) => cat.id === product?.category_id)?.name ||
    'Unknown'

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Loading product information...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!product) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Product Not Found</DialogTitle>
            <DialogDescription>
              The product you're looking for doesn't exist.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const variants = product.variants || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-base font-medium">{product.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-base">
                  {product.description || 'No description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p className="text-base">{categoryName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div>
                    <Badge
                      variant={product.is_active ? 'default' : 'outline'}
                      className={
                        product.is_active
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  SKU
                </label>
                <p className="text-base">{product.sku || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Price
                </label>
                <p className="text-base">
                  {product.price !== null
                    ? `$${Number(product.price).toFixed(2)}`
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Stock
                </label>
                <p className="text-base">{product.stock ?? 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Variants ({variants.length})
                </h3>
                <div className="space-y-4">
                  {variants.map((variant: any, index: number) => (
                    <div
                      key={variant.id || index}
                      className="border border-stone-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base">
                          {variant.name}
                        </h4>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="text-muted-foreground">SKU</label>
                          <p>{variant.sku || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Price</label>
                          <p>
                            {variant.price !== null
                              ? `$${Number(variant.price).toFixed(2)}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-muted-foreground">Stock</label>
                          <p>{variant.stock ?? 'N/A'}</p>
                        </div>
                      </div>

                      {variant.options && variant.options.length > 0 && (
                        <div className="pt-2 border-t border-stone-100">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Options
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {variant.options.map((option: any, optIndex: number) => (
                              <Badge
                                key={option.id || optIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {option.name}: {option.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {variants.length === 0 && (
            <>
              <Separator />
              <div className="text-center text-muted-foreground py-4">
                No variants configured for this product.
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(product.created_at).toLocaleString()}
            </div>
            {product.updated_at && (
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(product.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

