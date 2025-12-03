import { createFileRoute } from '@tanstack/react-router'
import { QueueOrders } from '@/features/orders'

export const Route = createFileRoute('/queue-orders/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Order Queue',
      },
    ],
  }),
})

function RouteComponent() {
  return <QueueOrders />
}

