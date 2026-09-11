import { useLocation } from "@tanstack/react-router";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export default function Header() {
  const { pathname } = useLocation();
  const { isMobile, state } = useSidebar();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex items-center gap-2 p-5">
      {!isMobile && state === "expanded" ? null : (
        <SidebarTrigger className="size-6 hover:bg-zinc-200 dark:hover:bg-zinc-800" />
      )}
      {segments.length === 0 ? (
        <span className="mb-0.5 text-lg font-semibold">Dashboard</span>
      ) : (
        segments.map((segment: string, index: number) => {
          const capitalizeWord = (word: string) => {
            return word
              .split(/[-\s]/)
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
          };

          return (
            <span key={index} className="mb-0.5 text-lg font-semibold">
              {index > 0 && <span className="mx-1">/</span>}
              {capitalizeWord(segment)}
            </span>
          );
        })
      )}
    </header>
  );
}
