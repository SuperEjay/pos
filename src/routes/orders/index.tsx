import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'

export const Route = createFileRoute('/orders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Orders />
}

