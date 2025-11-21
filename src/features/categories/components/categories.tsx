import { useState } from 'react'

import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useGetCategories } from '../hooks'
import { CategoryModal } from './category-modal'
import type { Category } from '@/features/categories/types'

import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Header } from '@/components'
import { Badge } from '@/components/ui/badge'

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { data: categories } = useGetCategories()

  // map the categories to the Category type
  const mappedCategories =
    categories?.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active ? 'Active' : 'Inactive',
      createdAt: category.created_at,
    })) ?? []

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (category: Category) => {
    console.log('Delete category:', category)
    // Implement delete functionality
  }

  const columns: Array<ColumnDef<Category>> = [
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
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(category)
              }}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(category)
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
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
            data={mappedCategories as unknown as Array<Category>}
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
