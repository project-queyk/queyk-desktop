import ReactDOM from "react-dom/client";
import { Window } from "@wailsio/runtime";
import { StrictMode, useEffect } from "react";
import {
  RouterProvider,
  createRouter,
  useLocation,
} from "@tanstack/react-router";

import "./styles.css";
import { routeTree } from "./routeTree.gen";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

const routeTitles: Record<string, string> = {
  "/": "Queyk - Dashboard",
  "/evacuation-plan": "Queyk - Evacuation Plan",
  "/protocols": "Queyk - Protocols",
  "/user-management": "Queyk - User Management",
  "/profile": "Queyk - Profile",
  "/sign-in": "Queyk - Sign In",
};

export function useWindowTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = routeTitles[pathname] || "Queyk";
    Window.SetTitle(title);
    document.title = title;
  }, [pathname]);
}

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  );
}
