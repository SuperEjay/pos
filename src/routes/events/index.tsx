import { createFileRoute } from '@tanstack/react-router'
import { Events } from '@/features/events'

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'Deja Bros CMS - Events' }],
  }),
})

function RouteComponent() {
  return <Events />
}
