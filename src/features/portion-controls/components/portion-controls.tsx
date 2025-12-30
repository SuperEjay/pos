import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, Search } from 'lucide-react'
import {
  useGetPortionControlsGroupedByCategory,
  useDeletePortionControl,
} from '../hooks'
import { PortionControlViewDialog } from './portion-control-view-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PortionControls() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useGetPortionControlsGroupedByCategory()
  const { mutate: deletePortionControl } = useDeletePortionControl()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [portionControlToDelete, setPortionControlToDelete] =
    useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [portionControlToView, setPortionControlToView] =
    useState<string | null>(null)

  // Determine which category to show
  const activeCategoryId = useMemo(() => {
    if (selectedCategory) return selectedCategory
    if (categories && categories.length > 0) return categories[0].id
    return null
  }, [selectedCategory, categories])

  // Filter recipes by selected category and search query
  const filteredRecipes = useMemo(() => {
    if (!categories || !activeCategoryId) return []
    const category = categories.find((cat) => cat.id === activeCategoryId)
    const recipes = category?.recipes || []

    if (!searchQuery) return recipes

    const query = searchQuery.toLowerCase()
    return recipes.filter((recipe) => {
      const nameMatch = recipe.name?.toLowerCase().includes(query)
      const productMatch = recipe.product_name?.toLowerCase().includes(query)
      const variantMatch = recipe.variant_name?.toLowerCase().includes(query)
      const descriptionMatch = recipe.description?.toLowerCase().includes(query)
      const categoryMatch = recipe.category_name?.toLowerCase().includes(query)

      return (
        nameMatch ||
        productMatch ||
        variantMatch ||
        descriptionMatch ||
        categoryMatch
      )
    })
  }, [categories, activeCategoryId, searchQuery])

  const handleView = useCallback((portionControlId: string) => {
    setPortionControlToView(portionControlId)
    setViewDialogOpen(true)
  }, [])

  const handleEdit = useCallback(
    (portionControlId: string) => {
      navigate({ to: `/portion-controls/${portionControlId}` })
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
    categories
      ?.flatMap((cat) => cat.recipes)
      .find((pc) => pc.id === portionControlToDelete)?.name || ''

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
    <div className="min-h-screen pb-20 sm:pb-6">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 mb-6 sm:mb-8 gap-4">
          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              Portion Controls
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage recipes for products and variants
            </p>
          </div>

          {/* New Recipe Button */}
          <Button
            onClick={() => navigate({ to: '/portion-controls/new' })}
            className="bg-stone-700 text-white hover:bg-stone-800 h-10 sm:h-11 w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Recipe
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search recipes by name, product, variant, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base bg-background border-stone-300 focus-visible:border-stone-400 focus-visible:ring-stone-200"
            />
          </div>
        </div>

        {/* Category Navigation Tabs */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto w-full pb-2 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6 scrollbar-hide">
            {categories.map((category) => {
              const isSelected = activeCategoryId === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'relative pb-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 px-2 py-1 rounded-md',
                    isSelected
                      ? 'text-stone-900 bg-stone-100'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50',
                  )}
                >
                  {category.name}
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-700 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredRecipes.map((recipe) => {
              const displayName = recipe.variant_name
                ? `${recipe.product_name} - ${recipe.variant_name}`
                : recipe.product_name || 'Unknown Product'

              return (
                <div
                  key={recipe.id}
                  className="bg-card rounded-lg p-4 sm:p-5 hover:shadow-md transition-all border border-stone-200 flex flex-col"
                >
                  {/* Recipe Header */}
                  <div className="mb-3 flex-shrink-0">
                    <h3 className="font-bold text-base sm:text-lg text-black mb-1 line-clamp-2 min-h-[2.5rem]">
                      {recipe.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 mb-2 line-clamp-1">
                      {displayName}
                    </p>
                    {recipe.serving_size && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs bg-stone-200 text-stone-700"
                      >
                        {recipe.serving_size}
                      </Badge>
                    )}
                  </div>

                  {/* Recipe Info */}
                  <div className="mb-4 space-y-1 flex-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-stone-500">Items:</span>
                      <span className="font-medium text-stone-900">
                        {recipe.items_count || 0}
                      </span>
                    </div>
                    {recipe.description && (
                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-2">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-stone-200 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(recipe.id)}
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
                    >
                      <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(recipe.id)}
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
                    >
                      <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recipe.id)}
                      className="h-9 sm:h-10 w-9 sm:w-10 p-0 text-destructive hover:text-destructive touch-manipulation"
                    >
                      <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-stone-600 text-base sm:text-lg">
              {searchQuery
                ? 'No recipes found matching your search.'
                : categories && categories.length > 0
                  ? 'No recipes available in this category.'
                  : 'No recipes found. Create your first recipe to get started.'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-4 border-stone-300"
              >
                Clear Search
              </Button>
            )}
            {(!categories || categories.length === 0) && !searchQuery && (
              <Button
                onClick={() => navigate({ to: '/portion-controls/new' })}
                className="mt-4 bg-stone-700 text-white hover:bg-stone-800"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Recipe
              </Button>
            )}
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
    </div>
  )
}
