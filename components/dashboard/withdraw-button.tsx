"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await apiRequest(`/api/applications/${applicationId}`, { method: "PATCH", body: { status: "WITHDRAWN" } });
          startTransition(() => router.refresh());
        } finally {
          setBusy(false);
        }
      }}
    >
      Withdraw
    </Button>
  );
}
