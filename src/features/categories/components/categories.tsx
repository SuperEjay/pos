import { useState } from 'react'

import { PlusIcon } from 'lucide-react'
import {
  useDeleteCategory,
  useGetCategories,
  useToggleCategoryStatus,
} from '../hooks'
import { CategoryModal } from './category-modal'
import { CategoriesTable } from './categories-table'
import type { CategoryTableRow } from './categories-table'
import type { Category } from '@/features/categories/types'

import { Button } from '@/components/ui/button'
import { Header } from '@/components'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const { data: categories } = useGetCategories()
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory()
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

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete)
      setCategoryToDelete(null)
    }
  }

  const handleToggleStatus = (categoryId: string, currentStatus: boolean) => {
    toggleStatus({ id: categoryId, isActive: !currentStatus })
  }

  const categoryToDeleteName =
    categoryToDelete &&
    mappedCategories.find((cat) => cat.id === categoryToDelete)?.name

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

          <CategoriesTable
            data={mappedCategories}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={editingCategory}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={
          categoryToDeleteName
            ? `Are you sure you want to delete "${categoryToDeleteName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this category? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}
