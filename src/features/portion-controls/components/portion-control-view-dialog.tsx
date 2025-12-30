import { useEffect } from 'react'
import { EyeIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetPortionControl } from '../hooks'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PortionControlViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portionControlId: string | null
}

export function PortionControlViewDialog({
  open,
  onOpenChange,
  portionControlId,
}: PortionControlViewDialogProps) {
  const queryClient = useQueryClient()
  const { data: portionControl, isLoading } = useGetPortionControl(
    portionControlId,
  )

  // Invalidate and refetch portion control data when dialog opens
  useEffect(() => {
    if (open && portionControlId) {
      queryClient.invalidateQueries({
        queryKey: ['portion-control', portionControlId],
      })
    }
  }, [open, portionControlId, queryClient])

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recipe Details</DialogTitle>
            <DialogDescription>Loading recipe information...</DialogDescription>
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

  if (!portionControl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Recipe Not Found</DialogTitle>
            <DialogDescription>
              The recipe you're looking for doesn't exist.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const items = portionControl.items || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeIcon className="w-5 h-5" />
            Recipe Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Recipe Name
                </label>
                <p className="text-base font-medium">{portionControl.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Product
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium">
                    {portionControl.product_name || 'Unknown'}
                  </p>
                  {portionControl.variant_name && (
                    <>
                      <span className="text-muted-foreground">-</span>
                      <Badge variant="outline">
                        {portionControl.variant_name}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {portionControl.serving_size && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Serving Size
                  </label>
                  <p className="text-base font-medium">
                    {portionControl.serving_size}
                  </p>
                </div>
              )}

              {portionControl.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-base">{portionControl.description}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Recipe Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Recipe Items ({items.length})
            </h3>
            {items.length > 0 ? (
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient Name</TableHead>
                      <TableHead>Serving Size</TableHead>
                      <TableHead>Unit</TableHead>
                      {items.some((item) => item.notes) && (
                        <TableHead>Notes</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.ingredient_name}
                        </TableCell>
                        <TableCell>{item.serving_size}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        {items.some((i) => i.notes) && (
                          <TableCell className="text-muted-foreground">
                            {item.notes || '-'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No items in this recipe.</p>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadata</h3>
            <div className="grid gap-4 text-sm">
              <div>
                <label className="text-muted-foreground">Created At</label>
                <p className="font-medium">
                  {new Date(portionControl.created_at).toLocaleString()}
                </p>
              </div>
              {portionControl.updated_at && (
                <div>
                  <label className="text-muted-foreground">Updated At</label>
                  <p className="font-medium">
                    {new Date(portionControl.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

