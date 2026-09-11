import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";

import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_main/user-management")({
  beforeLoad: async () => {
    try {
      const { data } = await getSession();

      if (!data?.session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bearer_token");
        }
        throw redirect({ to: "/sign-in" });
      }

      if ((data.user as any)?.role !== "admin") {
        throw redirect({ to: "/evacuation-plan" });
      }

      return { user: data?.user };
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
      }
      throw redirect({ to: "/sign-in" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div></div>;
}
