import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features'

export const Route = createFileRoute('/(manage products)/products/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Products />
}
