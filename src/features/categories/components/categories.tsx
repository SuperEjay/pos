import { Separator } from '@/components/ui/separator'

export default function Categories() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500">
          Manage your categories here. You can add, edit, and delete categories.
        </p>
      </div>
      <Separator />
    </div>
  )
}
