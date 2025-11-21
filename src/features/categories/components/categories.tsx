import { useState } from 'react'

import {
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  useDeleteCategory,
  useGetCategories,
  useToggleCategoryStatus,
} from '../hooks'
import { CategoryModal } from './category-modal'
import type { Category } from '@/features/categories/types'

import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Header } from '@/components'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type CategoryTableRow = Category & {
  is_active: string
  is_active_bool: boolean
}

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { data: categories } = useGetCategories()
  const { mutate: deleteCategory } = useDeleteCategory()
  const { mutate: toggleStatus } = useToggleCategoryStatus()

  // map the categories to the Category type
  const mappedCategories: Array<CategoryTableRow> =
    categories?.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
      updatedAt: category.updated_at || category.created_at,
      is_active: category.is_active ? 'Active' : 'Inactive',
      is_active_bool: category.is_active,
    })) ?? []

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: CategoryTableRow) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory(categoryId)
    }
  }

  const handleToggleStatus = (categoryId: string, currentStatus: boolean) => {
    toggleStatus({ id: categoryId, isActive: !currentStatus })
  }

  const columns: Array<ColumnDef<CategoryTableRow>> = [
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
        <div className="text-muted-foreground">
          {row.getValue('description') || 'No description'}
        </div>
      ),
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
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const category = row.original
        const isActive = category.is_active_bool

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
                  handleEdit(category)
                }}
              >
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleStatus(category.id, isActive)
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
                  handleDelete(category.id)
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
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="Categories"
          description="Manage your categories here. You can add, edit, and delete categories."
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="w-4 h-4" />
              Add Category
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={mappedCategories}
            searchKey="name"
            searchPlaceholder="Search categories..."
            enablePagination={false}
          />
        </div>
      </div>

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={editingCategory}
      />
    </>
  )
}
