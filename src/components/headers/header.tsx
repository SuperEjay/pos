import { Separator } from '@/components/ui/separator'

export default function Header({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {title && <h1 className="text-xl font-bold">{title}</h1>}
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <Separator />
    </>
  )
}
