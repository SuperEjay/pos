import { useEffect } from 'react'
import { List } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetPortionControl } from '../hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PortionControlItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portionControlId: string | null
}

export function PortionControlItemsDialog({
  open,
  onOpenChange,
  portionControlId,
}: PortionControlItemsDialogProps) {
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recipe Items</DialogTitle>
            <DialogDescription>Loading recipe items...</DialogDescription>
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Recipe Items - {portionControl.name}
          </DialogTitle>
          <DialogDescription>
            View all ingredients and items for this recipe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
            <p className="text-muted-foreground text-center py-8">
              No items in this recipe.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


