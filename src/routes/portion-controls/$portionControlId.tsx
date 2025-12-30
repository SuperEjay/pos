import { createFileRoute } from '@tanstack/react-router'
import { PortionControlForm } from '@/features/portion-controls'
import { useGetPortionControl } from '@/features/portion-controls/hooks'

export const Route = createFileRoute(
  '/portion-controls/$portionControlId',
)({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: 'Deja Bros CMS - Edit Recipe',
      },
    ],
  }),
})

function RouteComponent() {
  const { portionControlId } = Route.useParams()
  const { data: portionControl } = useGetPortionControl(portionControlId)

  return <PortionControlForm portionControl={portionControl || null} />
}
