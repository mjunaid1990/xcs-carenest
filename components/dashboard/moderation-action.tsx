"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { apiRequest, ClientApiError } from "@/lib/client";

/** Privileged action button; every request is audit-logged server-side. */
export function ModerationAction({
  type,
  id,
  action,
  label,
  variant = "outline",
  status,
  confirmText,
}: {
  type: "user" | "verification" | "report" | "review" | "job";
  id: string;
  action: string;
  label: string;
  variant?: ButtonProps["variant"];
  status?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col">
      <Button
        size="sm"
        variant={variant}
        disabled={busy}
        onClick={async () => {
          if (confirmText && !window.confirm(confirmText)) return;
          setBusy(true);
          setError(undefined);
          try {
            await apiRequest("/api/admin/moderation", {
              method: "PATCH",
              body: { type, id, action, status },
            });
            startTransition(() => router.refresh());
          } catch (err) {
            setError(err instanceof ClientApiError ? err.message : "Action failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : label}
      </Button>
      {error ? <span className="mt-0.5 text-[10px] text-destructive">{error}</span> : null}
    </span>
  );
}
