import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { EyeIcon, MoreHorizontal, PencilIcon, TrashIcon, SearchIcon, XIcon, PlusIcon } from 'lucide-react'
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
  onAddOrder?: () => void
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
  onAddOrder,
  filters,
  onFiltersChange,
  categories,
}: OrdersTableProps) {
  // Local state for all filter inputs
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || 'all',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    customer_name: filters.customer_name || '',
    product_name: filters.product_name || '',
    category_id: filters.category_id || 'all',
  })

  // Sync local state with filters when filters change externally
  useEffect(() => {
    setLocalFilters({
      status: filters.status || 'all',
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
      customer_name: filters.customer_name || '',
      product_name: filters.product_name || '',
      category_id: filters.category_id || 'all',
    })
  }, [filters])

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

  // Calculate total sales from filtered data
  const totalSales = useMemo(() => {
    return data.reduce((sum, order) => sum + Number(order.total || 0), 0)
  }, [data])

  // Format number in accounting format (comma-separated thousands)
  const formatAccounting = useCallback((num: number): string => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  // Apply filters when button is clicked
  const handleApplyFilters = useCallback(() => {
    // Validate dates before applying
    const isValidDate = (date: string) => {
      if (!date) return true
      if (date.length !== 10) return false
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
      const parsed = new Date(date)
      if (isNaN(parsed.getTime())) return false
      const [year, month, day] = date.split('-').map(Number)
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
      )
    }

    // Only apply if dates are valid
    if (localFilters.date_from && !isValidDate(localFilters.date_from)) {
      return // Don't apply if date_from is invalid
    }
    if (localFilters.date_to && !isValidDate(localFilters.date_to)) {
      return // Don't apply if date_to is invalid
    }

    onFiltersChange({
      status: localFilters.status === 'all' ? undefined : (localFilters.status as OrderStatus),
      date_from: localFilters.date_from || undefined,
      date_to: localFilters.date_to || undefined,
      customer_name: localFilters.customer_name || undefined,
      product_name: localFilters.product_name || undefined,
      category_id: localFilters.category_id === 'all' ? undefined : localFilters.category_id,
    })
  }, [localFilters, onFiltersChange])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      status: 'all',
      date_from: '',
      date_to: '',
      customer_name: '',
      product_name: '',
      category_id: 'all',
    })
    onFiltersChange({})
  }, [onFiltersChange])

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
      accessorKey: 'payment_method',
      header: 'Payment Method',
      cell: ({ row }) => {
        const paymentMethod = row.getValue('payment_method') as string | null
        if (!paymentMethod) return <div className="text-muted-foreground">-</div>
        return (
          <Badge variant="outline" className="capitalize">
            {paymentMethod === 'gcash' ? 'GCash' : paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
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
      {/* Total Sales and Orders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border border-stone-200 rounded-lg bg-gradient-to-r from-stone-50 to-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-stone-600 mb-1">Total Sales</h3>
              <p className="text-3xl font-bold text-stone-900">₱{formatAccounting(totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="p-6 border border-stone-200 rounded-lg bg-gradient-to-r from-stone-50 to-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-stone-600 mb-1">Total Orders</h3>
              <p className="text-3xl font-bold text-stone-900">{data.length.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 p-4 border border-stone-200 rounded-lg bg-stone-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, status: value }))
              }
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
              value={localFilters.date_from}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, date_from: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date-to">Date To</Label>
            <Input
              id="date-to"
              type="date"
              value={localFilters.date_to}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, date_to: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-filter">Customer Name</Label>
            <Input
              id="customer-filter"
              placeholder="Search customer..."
              value={localFilters.customer_name}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, customer_name: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-filter">Product Name</Label>
            <Input
              id="product-filter"
              placeholder="Search product..."
              value={localFilters.product_name}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, product_name: e.target.value }))
              }
              className="bg-white border-stone-300 w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category-filter">Category</Label>
            <Select
              value={localFilters.category_id}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, category_id: value }))
              }
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

        {/* Filter Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
          <div>
            {onAddOrder && (
              <Button size="sm" onClick={onAddOrder} className="bg-stone-700 text-white hover:bg-stone-800">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Order
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="bg-stone-700 text-white hover:bg-stone-800"
            >
              <SearchIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
      />
    </div>
  )
})
