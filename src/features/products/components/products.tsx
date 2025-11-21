import { useState } from 'react'

import { PlusIcon } from 'lucide-react'
import {
  useDeleteProduct,
  useGetProducts,
  useToggleProductStatus,
} from '../hooks'
import { ProductModal } from './product-modal'
import { ProductViewDialog } from './product-view-dialog'
import { ProductsTable } from './products-table'
import type { ProductTableRow } from './products-table'
import type { Product } from '@/features/products/types'

import { Button } from '@/components/ui/button'
import { Header } from '@/components'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProductId, setViewingProductId] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const { data: products } = useGetProducts()
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()
  const { mutate: toggleStatus } = useToggleProductStatus()

  // map the products to the ProductTableRow type
  const mappedProducts: Array<ProductTableRow> =
    products?.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      created_at: product.created_at,
      updated_at: product.updated_at || product.created_at,
      category_name: product.category_name,
      variants_count: product.variants_count || 0,
      is_active: product.is_active ? 'Active' : 'Inactive',
      is_active_bool: product.is_active,
    })) ?? []

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleView = (productId: string) => {
    setViewingProductId(productId)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (product: ProductTableRow) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      is_active: product.is_active_bool,
      created_at: product.created_at,
      updated_at: product.updated_at,
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete)
      setProductToDelete(null)
    }
  }

  const handleToggleStatus = (productId: string, currentStatus: boolean) => {
    toggleStatus({ id: productId, isActive: !currentStatus })
  }

  const productToDeleteName =
    productToDelete &&
    mappedProducts.find((prod) => prod.id === productToDelete)?.name

  return (
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="Products"
          description="Manage your products here. You can add, edit, and delete products."
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={handleCreate}>
              <PlusIcon className="w-4 h-4" />
              Add Product
            </Button>
          </div>

          <ProductsTable
            data={mappedProducts}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      <ProductModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={editingProduct}
      />

      <ProductViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        productId={viewingProductId}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={
          productToDeleteName
            ? `Are you sure you want to delete "${productToDeleteName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this product? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}
