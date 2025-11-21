import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features'

export const Route = createFileRoute('/(manage products)/products/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'CafePOS CMS - Products',
      },
    ],
  }),
})

function RouteComponent() {
  return <Products />
}
