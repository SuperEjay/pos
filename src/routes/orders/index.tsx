import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'

export const Route = createFileRoute('/orders/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'CafePOS CMS - Categories',
      },
    ],
  }),
})

function RouteComponent() {
  return <Orders />
}
