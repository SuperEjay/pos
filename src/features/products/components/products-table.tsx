import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  ToggleLeft,
  ToggleRight,
  TrashIcon,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Product } from '@/features/products/types'
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

export type ProductTableRow = Omit<Product, 'is_active'> & {
  category_name?: string | null
  variants_count?: number
  is_active: string
  is_active_bool: boolean
}

interface ProductsTableProps {
  data: Array<ProductTableRow>
  onEdit: (product: ProductTableRow) => void
  onView: (productId: string) => void
  onDelete: (productId: string) => void
  onToggleStatus: (productId: string, currentStatus: boolean) => void
}

export function ProductsTable({
  data,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
}: ProductsTableProps) {
  const columns: Array<ColumnDef<ProductTableRow>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
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
      accessorKey: 'variants_count',
      header: 'No of Variants',
      cell: ({ row }) => {
        const count = row.getValue('variants_count') as number | undefined
        return <div>{count ?? 0}</div>
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('is_active') === 'Active' ? 'default' : 'outline'
          }
          className={
            row.getValue('is_active') === 'Active'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }
        >
          {row.getValue('is_active')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const product = row.original
        const isActive = product.is_active_bool

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
                  onView(product.id)
                }}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(product)
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStatus(product.id, isActive)
                }}
              >
                {isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(product.id)
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
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search products..."
    />
  )
}

