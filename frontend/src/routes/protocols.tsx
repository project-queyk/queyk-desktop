import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/protocols')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/protocols"!</div>
}
