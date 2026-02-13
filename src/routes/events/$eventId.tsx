import { createFileRoute } from '@tanstack/react-router'
import { EventForm } from '@/features/events/components/event-form'
import { useGetEvent } from '@/features/events/hooks'

export const Route = createFileRoute('/events/$eventId')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'Deja Bros CMS - Edit Event' }],
  }),
})

function RouteComponent() {
  const { eventId } = Route.useParams()
  const { data: event } = useGetEvent(eventId)

  return <EventForm event={event ?? null} />
}
