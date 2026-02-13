import { memo, useCallback, useMemo } from 'react'
import { MoreHorizontal, PencilIcon, TrashIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Event } from '@/features/events/types'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export type EventTableRow = Event

interface EventsTableProps {
  data: EventTableRow[]
  onEdit: (event: EventTableRow) => void
  onDelete: (eventId: string) => void
}

const categoryLabels: Record<Event['category'], string> = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  private: 'Private',
}

export const EventsTable = memo(function EventsTable({
  data,
  onEdit,
  onDelete,
}: EventsTableProps) {
  const handleEdit = useCallback(
    (event: EventTableRow) => onEdit(event),
    [onEdit],
  )
  const handleDelete = useCallback(
    (eventId: string) => onDelete(eventId),
    [onDelete],
  )

  const columns: Array<ColumnDef<EventTableRow>> = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-muted-foreground">
            {row.original.location}
          </div>
        ),
      },
      {
        accessorKey: 'event_date',
        header: 'Date',
        cell: ({ row }) => (
          <div>
            {new Date(row.original.event_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {categoryLabels[row.original.category]}
          </Badge>
        ),
      },
      {
        accessorKey: 'pax',
        header: 'Pax',
        cell: ({ row }) => <div>{row.original.pax}</div>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const event = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEdit(event)}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(event.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleEdit, handleDelete],
  )

  return <DataTable columns={columns} data={data} />
})
