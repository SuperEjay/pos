import { memo, useMemo, useCallback } from 'react'
import {
  EyeIcon,
  MoreHorizontal,
  PencilIcon,
  ToggleLeft,
  ToggleRight,
  TrashIcon,
  CopyIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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
  onClone: (productId: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (categoryId: string) => void
  categories?: Array<{ id: string; name: string }>
}

export const ProductsTable = memo(function ProductsTable({
  data,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  onClone,
  categoryFilter,
  onCategoryFilterChange,
  categories,
}: ProductsTableProps) {
  const handleView = useCallback(
    (productId: string) => {
      onView(productId)
    },
    [onView],
  )

  const handleEdit = useCallback(
    (product: ProductTableRow) => {
      onEdit(product)
    },
    [onEdit],
  )

  const handleDelete = useCallback(
    (productId: string) => {
      onDelete(productId)
    },
    [onDelete],
  )

  const handleToggleStatus = useCallback(
    (productId: string, currentStatus: boolean) => {
      onToggleStatus(productId, currentStatus)
    },
    [onToggleStatus],
  )

  const handleClone = useCallback(
    (productId: string) => {
      onClone(productId)
    },
    [onClone],
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      onCategoryFilterChange?.(value)
    },
    [onCategoryFilterChange],
  )

  const columns: Array<ColumnDef<ProductTableRow>> = useMemo(
    () => [
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
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => {
        const categoryName = row.getValue('category_name') as string | null | undefined
        return (
          <div className="font-medium">
            {categoryName || 'Uncategorized'}
          </div>
        )
      },
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
                  handleView(product.id)
                }}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(product)
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleClone(product.id)
                }}
              >
                <CopyIcon className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleStatus(product.id, isActive)
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
                  handleDelete(product.id)
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
    [handleView, handleEdit, handleDelete, handleToggleStatus, handleClone],
  )

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      {onCategoryFilterChange && categories && (
        <div className="p-4 border border-stone-200 rounded-lg bg-stone-50">
          <div className="grid gap-2 max-w-xs">
            <Label htmlFor="category-filter">Filter by Category</Label>
            <Select
              value={categoryFilter || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger
                id="category-filter"
                className="bg-white border-stone-300 w-full"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search products..."
      />
    </div>
  )
})
