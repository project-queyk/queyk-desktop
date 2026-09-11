import {
  createFileRoute,
  Outlet,
  redirect,
  isRedirect,
} from "@tanstack/react-router";

import { getSession, useSession } from "@/lib/auth-client";

import Header from "@/components/Header";
import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_main")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (
        url.searchParams.get("popup") === "true" ||
        url.searchParams.get("token")
      ) {
        return {};
      }
    }

    try {
      const { data } = await getSession();
      if (!data?.session) {
        if (typeof window !== "undefined")
          localStorage.removeItem("bearer_token");
        throw redirect({ to: "/sign-in" });
      }
      return { user: data.user, session: data.session };
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (typeof window !== "undefined")
        localStorage.removeItem("bearer_token");
      throw redirect({ to: "/sign-in" });
    }
  },
  component: MainLayout,
});

function MainLayout() {
  const { data: session } = useSession();

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <main className="w-full">
        <Header />
        <div className="mx-5 mb-5">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
