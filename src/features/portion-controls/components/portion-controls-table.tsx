import { memo, useMemo, useCallback } from 'react'
import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { PortionControlWithDetails } from '../types'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type PortionControlTableRow = PortionControlWithDetails

interface PortionControlsTableProps {
  data: Array<PortionControlTableRow>
  onView: (portionControlId: string) => void
  onEdit: (portionControlId: string) => void
  onDelete: (portionControlId: string) => void
}

export const PortionControlsTable = memo(function PortionControlsTable({
  data,
  onView,
  onEdit,
  onDelete,
}: PortionControlsTableProps) {
  const handleView = useCallback(
    (portionControlId: string) => {
      onView(portionControlId)
    },
    [onView],
  )

  const handleEdit = useCallback(
    (portionControlId: string) => {
      onEdit(portionControlId)
    },
    [onEdit],
  )

  const handleDelete = useCallback(
    (portionControlId: string) => {
      onDelete(portionControlId)
    },
    [onDelete],
  )

  const columns: Array<ColumnDef<PortionControlTableRow>> = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Recipe Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'product_name',
        header: 'Product',
        cell: ({ row }) => {
          const productName = row.getValue('product_name') as string | null
          const variantName = row.original.variant_name
          return (
            <div className="font-medium">
              {productName || 'Unknown'}
              {variantName && (
                <span className="text-muted-foreground ml-1">
                  - {variantName}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'serving_size',
        header: 'Serving Size',
        cell: ({ row }) => {
          const servingSize = row.getValue('serving_size') as string | null
          return (
            <div className="text-muted-foreground">
              {servingSize || 'N/A'}
            </div>
          )
        },
      },
      {
        accessorKey: 'items_count',
        header: 'Items',
        cell: ({ row }) => {
          const count = row.getValue('items_count') as number | undefined
          return <div>{count ?? 0}</div>
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="text-muted-foreground max-w-md truncate">
            {row.getValue('description') || 'No description'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const portionControl = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleView(portionControl.id)
                  }}
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(portionControl.id)
                  }}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(portionControl.id)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleView, handleEdit, handleDelete],
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search recipes..."
    />
  )
})

