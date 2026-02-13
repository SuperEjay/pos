import { createFileRoute } from '@tanstack/react-router'
import { EventForm } from '@/features/events/components/event-form'

export const Route = createFileRoute('/events/new')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'Deja Bros CMS - New Event' }],
  }),
})

function RouteComponent() {
  return <EventForm />
}
