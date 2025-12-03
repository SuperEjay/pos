import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'

export const Route = createFileRoute('/orders/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Orders',
      },
    ],
  }),
})

function RouteComponent() {
  return <Orders />
}
