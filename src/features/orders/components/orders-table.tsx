import { memo, useMemo, useCallback } from 'react'
import { EyeIcon, MoreHorizontal, PencilIcon, TrashIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Order, OrderStatus } from '@/features/orders/types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type OrderTableRow = Order

interface OrdersTableProps {
  data: Array<OrderTableRow>
  onEdit: (order: OrderTableRow) => void
  onView: (orderId: string) => void
  onDelete: (orderId: string) => void
  filters: {
    status?: OrderStatus
    date_from?: string
    date_to?: string
    customer_name?: string
    product_name?: string
    category_id?: string
  }
  onFiltersChange: (filters: OrdersTableProps['filters']) => void
  categories?: Array<{ id: string; name: string }>
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-blue-500 text-white',
  completed: 'bg-green-500 text-white',
  cancelled: 'bg-red-500 text-white',
  refunded: 'bg-gray-500 text-white',
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export const OrdersTable = memo(function OrdersTable({
  data,
  onEdit,
  onView,
  onDelete,
  filters,
  onFiltersChange,
  categories,
}: OrdersTableProps) {
  const handleView = useCallback(
    (orderId: string) => {
      onView(orderId)
    },
    [onView],
  )

  const handleEdit = useCallback(
    (order: OrderTableRow) => {
      onEdit(order)
    },
    [onEdit],
  )

  const handleDelete = useCallback(
    (orderId: string) => {
      onDelete(orderId)
    },
    [onDelete],
  )

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value === 'all' ? undefined : (value as OrderStatus),
      })
    },
    [filters, onFiltersChange],
  )

  const handleDateFromChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        date_from: value || undefined,
      })
    },
    [filters, onFiltersChange],
  )

  const handleDateToChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        date_to: value || undefined,
      })
    },
    [filters, onFiltersChange],
  )

  const handleCustomerNameChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        customer_name: value || undefined,
      })
    },
    [filters, onFiltersChange],
  )

  const handleProductNameChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        product_name: value || undefined,
      })
    },
    [filters, onFiltersChange],
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        category_id: value === 'all' ? undefined : value,
      })
    },
    [filters, onFiltersChange],
  )

  const columns: Array<ColumnDef<OrderTableRow>> = useMemo(
    () => [
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('customer_name')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status')
        return (
          <Badge
            variant="outline"
            className={statusColors[status as OrderStatus]}
          >
            {statusLabels[status as OrderStatus]}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'order_type',
      header: 'Type',
      cell: ({ row }) => {
        const orderType = row.getValue('order_type') as string | null
        if (!orderType) return <div className="text-muted-foreground">-</div>
        return (
          <Badge variant="outline" className="capitalize">
            {orderType === 'pickup' ? 'Pickup' : 'Delivery'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = row.getValue('total')
        return <div>₱{Number(total).toFixed(2)}</div>
      },
    },
    {
      accessorKey: 'order_date',
      header: 'Order Date',
      cell: ({ row }) => {
        const date = row.getValue('order_date')
        return <div>{new Date(date as string).toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const order = row.original

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
                  handleView(order.id)
                }}
              >
                <EyeIcon className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(order)
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(order.id)
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 border border-stone-200 rounded-lg bg-stone-50">
        <div className="grid gap-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger
              id="status-filter"
              className="bg-white border-stone-300 w-full"
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date-from">Date From</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="bg-white border-stone-300 w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date-to">Date To</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="bg-white border-stone-300 w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-filter">Customer Name</Label>
          <Input
            id="customer-filter"
            placeholder="Search customer..."
            value={filters.customer_name || ''}
            onChange={(e) => handleCustomerNameChange(e.target.value)}
            className="bg-white border-stone-300 w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="product-filter">Product Name</Label>
          <Input
            id="product-filter"
            placeholder="Search product..."
            value={filters.product_name || ''}
            onChange={(e) => handleProductNameChange(e.target.value)}
            className="bg-white border-stone-300 w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            value={filters.category_id || 'all'}
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
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="customer_name"
        searchPlaceholder="Search orders by customer name..."
      />
    </div>
  )
})
