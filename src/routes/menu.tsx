import { createFileRoute } from '@tanstack/react-router'
import Menu from '@/features/products/components/menu'

export const Route = createFileRoute('/menu')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros - Menu',
      },
    ],
  }),
})

function RouteComponent() {
  return <Menu />
}

