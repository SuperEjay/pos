import { createFileRoute } from '@tanstack/react-router'
import { Expenses } from '@/features/expenses'

export const Route = createFileRoute('/expenses/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Expenses',
      },
    ],
  }),
})

function RouteComponent() {
  return <Expenses />
}

