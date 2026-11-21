"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest, ClientApiError } from "@/lib/client";

export function PlanAction({
  planSlug,
  annual,
  label,
  current,
  disabled,
}: {
  planSlug: string;
  annual: boolean;
  label: string;
  current?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    setBusy(true);
    setError(undefined);
    try {
      const result = await apiRequest<{ url: string; mode: string }>("/api/subscription/checkout", {
        method: "POST",
        body: { planSlug, interval: annual ? "annual" : "monthly" },
      });
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant={current ? "outline" : "default"} onClick={start} disabled={busy || disabled}>
        {busy ? "Starting…" : label}
      </Button>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function CancelPlan({ disabled }: { disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          try {
            await apiRequest("/api/subscription/cancel", { method: "POST" });
            setMessage("Cancellation scheduled for the end of this billing period.");
          } catch (err) {
            setMessage(err instanceof ClientApiError ? err.message : "Could not cancel the plan.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Cancel at period end
      </Button>
      {message ? <p className="text-[11px] text-muted-foreground">{message}</p> : null}
    </div>
  );
}
