import { useEffect, useState } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";

const RootLayout = () => {
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const isPopupParam = url.searchParams.get("popup") === "true";
      const token = url.searchParams.get("token");
      const error = url.searchParams.get("error");

      if (isPopupParam || token) {
        setIsPopup(true);
        const channel = new BroadcastChannel("auth_channel");
        if (token) {
          localStorage.setItem("bearer_token", token);
          channel.postMessage({ type: "LOGIN_SUCCESS", token });
        } else {
          const errCode = error || "AccessDenied";
          channel.postMessage({ type: "LOGIN_ERROR", error: errCode });
        }
        channel.close();
      }
    }
  }, []);

  if (isPopup) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Completing sign in...</p>
      </div>
    );
  }

  return (
    <>
      <hr />
      <Outlet />
    </>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
