"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="bg-destructive/15 text-destructive mb-5 grid size-12 place-items-center rounded-2xl">
        <AlertTriangle className="size-5" />
      </span>
      <h1 className="text-foreground text-2xl font-semibold">
        The quiet was interrupted
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
        Something unexpected happened while loading this page.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
