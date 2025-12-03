import { createFileRoute } from '@tanstack/react-router'
import { Categories } from '@/features'

export const Route = createFileRoute('/(manage products)/categories/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Categories',
      },
    ],
  }),
})

function RouteComponent() {
  return <Categories />
}
