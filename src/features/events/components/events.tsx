import { useCallback, useState } from 'react'
import { useDeleteEvent, useGetEvents } from '../hooks'
import { EventsTable } from './events-table'
import type { EventTableRow } from './events-table'
import { Header } from '@/components'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

export default function Events() {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  const { data: events, isLoading } = useGetEvents()
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent()

  const handleCreate = useCallback(() => {
    navigate({ to: '/events/new' })
  }, [navigate])

  const handleEdit = useCallback(
    (event: EventTableRow) => {
      navigate({ to: '/events/$eventId', params: { eventId: event.id } })
    },
    [navigate],
  )

  const handleDeleteClick = useCallback((eventId: string) => {
    setEventToDelete(eventId)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (eventToDelete) {
      deleteEvent(eventToDelete, {
        onSuccess: () => {
          setEventToDelete(null)
          setIsDeleteDialogOpen(false)
        },
      })
    }
  }, [eventToDelete, deleteEvent])

  return (
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="Events"
          description="Manage portfolio events. These appear on the Deja Bros website /events page."
        />
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : (
          <EventsTable
            data={events ?? []}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        description="This event will be removed from the website. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}
