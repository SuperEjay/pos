import { createFileRoute } from '@tanstack/react-router'
import { POSInterface } from '@/features/orders'
import { Toaster } from 'sonner'

export const Route = createFileRoute('/pos/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros - Point of Sale',
      },
    ],
  }),
})

function RouteComponent() {
  return (
    <>
      <POSInterface />
      <Toaster />
    </>
  )
}

