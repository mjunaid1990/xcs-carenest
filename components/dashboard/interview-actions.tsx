"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ClientApiError } from "@/lib/client";

export function InterviewActions({ interviewId, role, status }: { interviewId: string; role: string; status: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [error, setError] = useState<string>();

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(undefined);
    try {
      await apiRequest(`/api/interviews/${interviewId}`, { method: "PATCH", body: { action, ...extra } });
      setReschedule(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not update the interview.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await act("RESCHEDULE", { date: String(form.get("date") ?? ""), time: String(form.get("time") ?? "") });
  }

  const done = ["CANCELLED", "DECLINED", "COMPLETED"].includes(status);

  return (
    <div className="space-y-2">
      {!done ? (
        <div className="flex flex-wrap gap-1.5">
          {role === "CAREGIVER" && status === "PROPOSED" ? (
            <>
              <Button size="sm" onClick={() => act("ACCEPT")} disabled={busy}>Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => act("DECLINE")} disabled={busy}>Decline</Button>
            </>
          ) : null}
          {role !== "CAREGIVER" ? (
            <>
              <Button size="sm" variant="outline" onClick={() => act("COMPLETE")} disabled={busy}>Mark completed</Button>
              <Button size="sm" variant="ghost" onClick={() => act("CANCEL")} disabled={busy}>Cancel</Button>
            </>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setReschedule((value) => !value)} disabled={busy}>Reschedule</Button>
        </div>
      ) : null}

      {reschedule ? (
        <form onSubmit={submitReschedule} className="flex flex-wrap items-end gap-2 rounded-xl bg-sand-50 p-3">
          <Input name="date" type="date" required className="w-auto" aria-label="New date" />
          <Input name="time" type="time" required className="w-auto" aria-label="New time" />
          <Button type="submit" size="sm" disabled={busy}>Save new time</Button>
        </form>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
