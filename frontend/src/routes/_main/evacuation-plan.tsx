import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/evacuation-plan")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
