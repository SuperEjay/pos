import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import {
  useGetPortionControls,
  useDeletePortionControl,
} from '../hooks'
import { PortionControlsTable } from './portion-controls-table'
import { PortionControlViewDialog } from './portion-control-view-dialog'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { PortionControlWithDetails } from '../types'

export function PortionControls() {
  const navigate = useNavigate()
  const { data: portionControls, isLoading } = useGetPortionControls()
  const { mutate: deletePortionControl } = useDeletePortionControl()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [portionControlToDelete, setPortionControlToDelete] =
    useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [portionControlToView, setPortionControlToView] =
    useState<string | null>(null)

  const handleView = useCallback((portionControlId: string) => {
    setPortionControlToView(portionControlId)
    setViewDialogOpen(true)
  }, [])

  const handleEdit = useCallback(
    (portionControlId: string) => {
      navigate({ to: `/portion-controls/${portionControlId}/edit` })
    },
    [navigate],
  )

  const handleDelete = useCallback((portionControlId: string) => {
    setPortionControlToDelete(portionControlId)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (portionControlToDelete) {
      deletePortionControl(portionControlToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setPortionControlToDelete(null)
        },
      })
    }
  }, [portionControlToDelete, deletePortionControl])

  const portionControlToDeleteName =
    portionControls?.find((pc) => pc.id === portionControlToDelete)?.name ||
    ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Portion Controls</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage recipes for products and variants
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: '/portion-controls/new' })}
          className="bg-stone-700 text-white hover:bg-stone-800 h-10 sm:h-11 w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Recipe
        </Button>
      </div>

      {portionControls && portionControls.length > 0 ? (
        <PortionControlsTable
          data={portionControls}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="border border-stone-200 rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No recipes found. Create your first recipe to get started.
          </p>
          <Button
            onClick={() => navigate({ to: '/portion-controls/new' })}
            className="bg-stone-700 text-white hover:bg-stone-800"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Recipe
          </Button>
        </div>
      )}

      <PortionControlViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        portionControlId={portionControlToView}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Recipe"
        description={`Are you sure you want to delete "${portionControlToDeleteName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

