import { FaGoogle } from "react-icons/fa";
import { Events } from "@wailsio/runtime";
import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

import { getSession, signIn } from "@/lib/auth-client";
import {
  CloseAuthWindow,
  OpenAuthWindow,
} from "../../bindings/queyk/internal/auth/service";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    const { data } = await getSession();

    if (data?.session) {
      throw redirect({ to: "/" });
    }

    return { user: data?.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const channel = new BroadcastChannel("auth_channel");
    channel.onmessage = (event) => {
      if (event.data?.type === "LOGIN_SUCCESS") {
        CloseAuthWindow().catch(() => {});
        setLoading(false);
        navigate({ to: "/" });
      } else if (event.data?.type === "LOGIN_ERROR") {
        CloseAuthWindow().catch(() => {});
        setLoading(false);
        navigate({
          to: "/error",
          search: { error: event.data.error || "AccessDenied" },
        });
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "bearer_token" && e.newValue) {
        CloseAuthWindow().catch(() => {});
        setLoading(false);
        navigate({ to: "/" });
      }
    };
    window.addEventListener("storage", handleStorage);

    const unsubClose = Events.On("auth-window-closed", () => {
      setLoading(false);
    });

    return () => {
      channel.close();
      window.removeEventListener("storage", handleStorage);
      unsubClose();
    };
  }, [navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/?popup=true`,
        errorCallbackURL: `${window.location.origin}/error?popup=true`,
        disableRedirect: true,
      });

      if (res.data?.url) {
        try {
          await OpenAuthWindow(res.data.url);
        } catch {
          window.open(res.data.url, "_blank", "width=500,height=650");
        }
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5">
        <div className="p-6">
          <div>
            <Link
              to="/"
              aria-label="go home"
              className="flex items-center gap-1.5"
            >
              <img
                src="/queyk.png"
                width={25}
                height={25}
                alt="queyk's logo"
                className="size-4.5 invert md:size-5.5 dark:invert-0"
              />
              <p className="mb-0.5 font-semibold md:text-xl">Queyk</p>
            </Link>
            <h1 className="mt-4 mb-1 text-xl font-semibold">
              Sign In to Queyk
            </h1>
            <p>Welcome back! Sign in to continue</p>
          </div>

          <div className="mt-3">
            <Button
              type="button"
              variant="default"
              disabled={loading}
              onClick={handleSignIn}
              className="w-full font-semibold"
            >
              <FaGoogle className="size-4" />
              <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
            </Button>
          </div>
        </div>
      </div>
      <p className="text-sm">
        By signing in, you agree to our{" "}
        <Link to="/protocols" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
