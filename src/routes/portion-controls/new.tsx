import { createFileRoute } from '@tanstack/react-router'
import { PortionControlForm } from '@/features/portion-controls'

export const Route = createFileRoute('/portion-controls/new')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - New Recipe',
      },
    ],
  }),
})

function RouteComponent() {
  return <PortionControlForm />
}
