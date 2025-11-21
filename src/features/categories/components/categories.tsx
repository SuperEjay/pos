import { useState } from 'react'

import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { CategoryModal } from './category-modal'
import type { Category } from '@/features/categories/types'

import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Header } from '@/components'

// Mock data - replace with actual data fetching later
const mockCategories: Array<Category> = [
  {
    id: '1',
    name: 'Beverages',
    description: 'Hot and cold drinks',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Food',
    description: 'Main dishes and snacks',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    name: 'Desserts',
    description: 'Sweet treats',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
]

export default function Categories() {
  const [categories, setCategories] = useState<Array<Category>>(mockCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleSave = (data: { name: string; description: string }) => {
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                name: data.name,
                description: data.description || null,
                updatedAt: new Date().toISOString(),
              }
            : cat,
        ),
      )
    } else {
      // Create new category
      const newCategory: Category = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCategories((prev) => [...prev, newCategory])
    }
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
            data={categories}
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
        onSave={handleSave}
      />
    </>
  )
}
