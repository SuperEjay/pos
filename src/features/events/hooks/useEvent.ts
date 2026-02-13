import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
} from '../services/events.service'
import type { EventFormValues } from '../schema/event-form'

export const useGetEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  })
}

export const useGetEvent = (id: string | null) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  })
}

export const useAddEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addEvent,
    onSuccess: () => {
      toast.success('Event added')
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to add event'),
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EventFormValues }) =>
      updateEvent(id, values),
    onSuccess: () => {
      toast.success('Event updated')
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update event'),
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success('Event deleted')
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: () => toast.error('Failed to delete event'),
  })
}
