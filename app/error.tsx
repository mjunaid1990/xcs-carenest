"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <h1 className="display mt-4 text-3xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-ink-500">
        An unexpected error interrupted this page. Please try again — if it keeps happening, contact
        support with the reference below.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}><RefreshCw className="h-4 w-4" /> Try again</Button>
        <Button asChild variant="outline"><Link href="/">Back home</Link></Button>
      </div>
    </div>
  );
}
