import { createFileRoute } from '@tanstack/react-router'
import { PortionControls } from '@/features/portion-controls'

export const Route = createFileRoute('/portion-controls/')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Portion Controls',
      },
    ],
  }),
})

function RouteComponent() {
  return <PortionControls />
}

