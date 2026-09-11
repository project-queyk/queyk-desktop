import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/protocols")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
