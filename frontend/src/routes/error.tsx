import { cn } from "cn";
import { Events } from "@wailsio/runtime";
import { FaGoogle } from "react-icons/fa";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { signIn } from "@/lib/auth-client";
import {
  CloseAuthWindow,
  OpenAuthWindow,
} from "../../bindings/queyk/internal/auth/service";

import { Button, buttonVariants } from "@/components/ui/button";

type ErrorSearchParams = {
  error?: string;
};

export const Route = createFileRoute("/error")({
  validateSearch: (search: Record<string, unknown>): ErrorSearchParams => {
    return {
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  component: ErrorPage,
});

export default function ErrorPage() {
  const { error } = Route.useSearch();
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

    const unsubClose = Events.On("auth-window-closed", () => {
      setLoading(false);
    });

    return () => {
      channel.close();
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

  function getErrorContent() {
    switch (error) {
      case "AccessDenied":
      case "FORBIDDEN":
      case "access_denied":
        return {
          title: "Access Denied",
          message:
            "Access restricted. You must use your official institutional email to sign in.",
          showGoogleButton: true,
          showHomeButton: false,
        };
      case "Verification":
      case "state_mismatch":
      case "state_security_mismatch":
        return {
          title: "Session Expired",
          message:
            "Authentication session expired or verification was interrupted. Please try signing in again.",
          showGoogleButton: true,
          showHomeButton: false,
        };
      case "Configuration":
      case "server_error":
        return {
          title: "Configuration Error",
          message:
            "There is a problem with the server configuration. Please check the logs or contact support.",
          showGoogleButton: false,
          showHomeButton: true,
        };
      default:
        return {
          title: "Authentication Error",
          message:
            "An unexpected error occurred during authentication. Please try again.",
          showGoogleButton: true,
          showHomeButton: false,
        };
    }
  }

  const { title, message, showGoogleButton, showHomeButton } =
    getErrorContent();

  return (
    <section className="flex min-h-screen px-4 py-16 md:py-32 dark:bg-transparent">
      <div className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5">
        <div className="p-6">
          <div>
            <Link
              to="/"
              aria-label="go home"
              className="flex items-center gap-1"
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
            <h1 className="text-destructive mt-4 mb-1 text-xl font-semibold">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {showGoogleButton && (
              <Button
                type="button"
                variant="default"
                disabled={loading}
                onClick={handleSignIn}
                className="w-full font-semibold"
              >
                <FaGoogle className="size-4" />
                <span>
                  {loading ? "Signing in..." : "Try Again with Google"}
                </span>
              </Button>
            )}

            {showHomeButton && (
              <Link
                to="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full font-semibold",
                )}
              >
                Back to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
