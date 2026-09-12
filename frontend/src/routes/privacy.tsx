import { createFileRoute, Link } from "@tanstack/react-router";

import { privacy } from "@/constants/privacy";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/privacy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <header className="mx-6 my-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5">
          <img
            src="/queyk.png"
            width={25}
            height={25}
            alt="queyk's logo"
            className="size-4.5 invert md:size-5.5 dark:invert-0"
          />
          <p className="mb-0.5 font-semibold md:text-xl">Queyk</p>
        </Link>
      </header>
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-3">
          <span className="mb-0.5 text-lg font-semibold">Privacy Policy</span>
          <p className="text-muted-foreground">
            Learn how we collect, use, and protect your personal information
            while providing earthquake monitoring services
          </p>
          {privacy.map((section) => (
            <Card className="w-full" key={section.header}>
              <CardHeader className="mx-4.5 flex flex-col items-stretch space-y-0 border-b p-0">
                <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
                  <CardTitle>{section.header}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 px-6 pb-4">
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {section.bulletItems.map((bullet) => (
                    <div className="flex flex-col gap-2" key={bullet.title}>
                      <h3 className="text-primary font-semibold">
                        {bullet.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {bullet.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="text-muted-foreground py-8 text-center text-xs md:text-sm">
            Last updated: Nov 8, 2025 | © {new Date().getFullYear()} Queyk
            Project - All Rights Reserved
          </div>
        </div>
      </div>
    </>
  );
}
