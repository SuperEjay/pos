# DataTable Component Usage Guide

The `DataTable` component is a reusable, feature-rich table component built on top of TanStack Table (React Table v8) and shadcn/ui components. It provides sorting, filtering, pagination, and search functionality out of the box.

## Installation

The DataTable component uses the following dependencies (already installed in this project):

- `@tanstack/react-table` - Core table functionality
- `@/components/ui/table` - shadcn/ui table components
- `@/components/ui/button` - Button components for pagination
- `@/components/ui/input` - Input component for search

## Basic Usage

### 1. Import the Component

```typescript
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
```

### 2. Define Your Data Type

```typescript
interface Product {
  id: string
  name: string
  price: number
  category: string
  createdAt: string
}
```

### 3. Define Column Definitions

```typescript
const columns: Array<ColumnDef<Product>> = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))
      return <div>${price.toFixed(2)}</div>
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
]
```

### 4. Use the Component

```typescript
function ProductsPage() {
  const products: Array<Product> = [
    // ... your data
  ]

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      searchPlaceholder="Search products..."
    />
  )
}
```

## Props

### Required Props

- **`columns`**: `Array<ColumnDef<TData, TValue>>` - Column definitions from TanStack Table
- **`data`**: `Array<TData>` - Array of data objects to display

### Optional Props

- **`searchKey`**: `string` - The key of the column to enable search/filtering on. If provided, a search input will be displayed.
- **`searchPlaceholder`**: `string` - Placeholder text for the search input (default: "Search...")
- **`onRowClick`**: `(row: TData) => void` - Callback function when a row is clicked. If provided, rows will have a pointer cursor.
- **`className`**: `string` - Additional CSS classes to apply to the table container
- **`enablePagination`**: `boolean` - Enable/disable pagination (default: `true`)
- **`enableSorting`**: `boolean` - Enable/disable column sorting (default: `true`)
- **`enableFiltering`**: `boolean` - Enable/disable filtering (default: `true`)

## Advanced Examples

### Example 1: With Actions Column

```typescript
const columns: Array<ColumnDef<Product>> = [
  // ... other columns
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(product)
            }}
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(product)
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      )
    },
  },
]

function ProductsPage() {
  const handleEdit = (product: Product) => {
    // Edit logic
  }

  const handleDelete = (product: Product) => {
    // Delete logic
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      onRowClick={(product) => {
        // Navigate to product detail page
      }}
    />
  )
}
```

### Example 2: With TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'

function ProductsPage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products')
      return response.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      searchPlaceholder="Search products..."
    />
  )
}
```

### Example 3: Custom Cell Rendering

```typescript
const columns: Array<ColumnDef<Product>> = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <div
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            status === 'active' && 'bg-green-100 text-green-800',
            status === 'inactive' && 'bg-gray-100 text-gray-800'
          )}
        >
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: 'image',
    header: 'Image',
    cell: ({ row }) => {
      const imageUrl = row.getValue('image') as string
      return (
        <img
          src={imageUrl}
          alt={row.original.name}
          className="w-10 h-10 rounded"
        />
      )
    },
  },
]
```

### Example 4: Disable Features

```typescript
<DataTable
  columns={columns}
  data={products}
  enablePagination={false}
  enableSorting={false}
  enableFiltering={false}
/>
```

## Column Definition Options

The `ColumnDef` type from TanStack Table provides many options. Here are the most commonly used:

### Basic Column

```typescript
{
  accessorKey: 'name',  // The key in your data object
  header: 'Name',       // Column header text
}
```

### Custom Cell Rendering

```typescript
{
  accessorKey: 'price',
  header: 'Price',
  cell: ({ row }) => {
    const price = row.getValue('price')
    return <div>${price}</div>
  },
}
```

### Custom Header

```typescript
{
  accessorKey: 'name',
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
}
```

### Sorting Configuration

```typescript
{
  accessorKey: 'name',
  header: 'Name',
  enableSorting: true,  // Enable sorting for this column
  sortingFn: 'alphanumeric',  // Custom sorting function
}
```

## Styling

The DataTable component uses Tailwind CSS and follows the shadcn/ui design system. You can customize the appearance by:

1. **Adding custom classes**: Use the `className` prop
2. **Customizing cell content**: Use custom cell renderers with your own styling
3. **Modifying the base components**: Edit `src/components/ui/table.tsx` for global table styles

## Best Practices

1. **Type Safety**: Always define TypeScript interfaces for your data types
2. **Memoization**: For large datasets, consider memoizing your columns definition
3. **Search Key**: Choose a meaningful search key that users would typically search by (usually a name or title field)
4. **Action Buttons**: Use `e.stopPropagation()` in action button click handlers to prevent row click events
5. **Loading States**: Show loading indicators when fetching data
6. **Empty States**: The table automatically shows "No results." when data is empty

## Integration with Supabase

Here's an example of using DataTable with Supabase:

```typescript
import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase'

function CategoriesPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
      
      if (error) throw error
      return data
    },
  })

  return (
    <DataTable
      columns={categoryColumns}
      data={categories}
      searchKey="name"
      searchPlaceholder="Search categories..."
    />
  )
}
```

## Troubleshooting

### Table not showing data

- Ensure your `data` prop is an array
- Check that your `accessorKey` values match your data object keys
- Verify that your data is not undefined (use default empty array: `data={products || []}`)

### Search not working

- Make sure `searchKey` matches an `accessorKey` in your columns
- Verify that `enableFiltering` is `true` (default)

### Sorting not working

- Ensure `enableSorting` is `true` (default)
- Check that your column definitions don't have `enableSorting: false`

### Type errors

- Make sure your data type matches the generic type in `ColumnDef<TData, TValue>`
- Use `Array<T>` instead of `T[]` for array types (project linting rule)

## Resources

- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)
- [React Table Examples](https://tanstack.com/table/latest/docs/examples/react/basic)

