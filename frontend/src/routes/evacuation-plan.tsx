import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/evacuation-plan")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/evacuation-plan"!</div>;
}
