import { createFileRoute } from '@tanstack/react-router'
import { SideBar } from '@/components'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <SideBar />
    </div>
  )
}
