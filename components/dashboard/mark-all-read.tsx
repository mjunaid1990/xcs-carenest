"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client";

export function MarkAllRead({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await apiRequest("/api/notifications", { method: "PATCH", body: { all: true } });
          startTransition(() => router.refresh());
        } finally {
          setBusy(false);
        }
      }}
    >
      Mark all as read
    </Button>
  );
}
