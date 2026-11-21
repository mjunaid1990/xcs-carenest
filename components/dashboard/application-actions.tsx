"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ClientApiError } from "@/lib/client";
import { Spinner } from "@/components/ui/feedback";

const DECISIONS = [
  { value: "REVIEWING", label: "Under review" },
  { value: "SHORTLISTED", label: "Shortlist" },
  { value: "INTERVIEW", label: "Move to interview" },
  { value: "HIRED", label: "Hire" },
  { value: "REJECTED", label: "Not selected" },
];

export function ApplicationActions({
  applicationId,
  status,
  caregiverUserId,
  jobId,
  caregiverName,
}: {
  applicationId: string;
  status: string;
  caregiverUserId: string;
  jobId: string;
  caregiverName: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [showInterview, setShowInterview] = useState(false);
  const [sent, setSent] = useState(false);

  async function decide(next: string) {
    setBusy(true);
    setError(undefined);
    try {
      await apiRequest(`/api/applications/${applicationId}`, { method: "PATCH", body: { status: next } });
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not update the application.");
    } finally {
      setBusy(false);
    }
  }

  async function schedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/interviews", {
        method: "POST",
        body: {
          caregiverId: caregiverUserId,
          jobId,
          applicationId,
          type: String(form.get("type") ?? "ONLINE"),
          date: String(form.get("date") ?? ""),
          time: String(form.get("time") ?? ""),
          durationMinutes: Number(form.get("durationMinutes") ?? 30),
          timezone: "America/New_York",
          meetingLink: String(form.get("meetingLink") ?? ""),
          notes: String(form.get("notes") ?? ""),
        },
      });
      setSent(true);
      setShowInterview(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not schedule the interview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {DECISIONS.filter((decision) => decision.value !== status).map((decision) => (
          <Button
            key={decision.value}
            size="sm"
            variant={decision.value === "HIRED" ? "default" : decision.value === "REJECTED" ? "ghost" : "outline"}
            disabled={busy || status === "HIRED" || status === "WITHDRAWN"}
            onClick={() => decide(decision.value)}
          >
            {decision.label}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setShowInterview((value) => !value)} disabled={busy}>
          Schedule interview
        </Button>
      </div>

      {sent ? <p className="text-xs text-emerald-700">Interview invitation sent to {caregiverName}.</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {showInterview ? (
        <form onSubmit={schedule} className="grid gap-2 rounded-xl border border-border bg-sand-50 p-3 sm:grid-cols-2">
          <select name="type" className="h-9 rounded-lg border border-input bg-white px-2 text-sm" aria-label="Interview type">
            <option value="ONLINE">Video call</option>
            <option value="PHONE">Phone</option>
            <option value="IN_PERSON">In person</option>
          </select>
          <Input name="durationMinutes" type="number" min={15} max={180} defaultValue={30} aria-label="Duration in minutes" />
          <Input name="date" type="date" required aria-label="Interview date" />
          <Input name="time" type="time" required aria-label="Interview time" />
          <Input name="meetingLink" type="url" placeholder="Meeting link (optional)" className="sm:col-span-2" />
          <Input name="notes" placeholder="Notes for the caregiver (optional)" className="sm:col-span-2" />
          <Button type="submit" size="sm" className="sm:col-span-2" disabled={busy}>
            {busy ? <Spinner /> : null} Send invitation
          </Button>
        </form>
      ) : null}
    </div>
  );
}
