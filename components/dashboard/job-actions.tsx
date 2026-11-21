"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest, ClientApiError } from "@/lib/client";
import { Spinner } from "@/components/ui/feedback";

/** Publish / pause / close controls. Each change is persisted through the REST API. */
export function JobActions({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function update(next: string) {
    setBusy(true);
    setError(undefined);
    try {
      await apiRequest(`/api/jobs/${jobId}`, { method: "PATCH", body: { status: next } });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not update the job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "DRAFT" || status === "PAUSED" ? (
        <Button size="sm" onClick={() => update("PUBLISHED")} disabled={busy || pending}>
          {busy ? <Spinner /> : null} Publish
        </Button>
      ) : null}
      {status === "PUBLISHED" ? (
        <Button size="sm" variant="outline" onClick={() => update("PAUSED")} disabled={busy || pending}>Pause</Button>
      ) : null}
      {status !== "CLOSED" && status !== "FILLED" ? (
        <Button size="sm" variant="ghost" onClick={() => update("CLOSED")} disabled={busy || pending}>Close</Button>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
