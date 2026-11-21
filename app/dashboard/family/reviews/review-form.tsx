"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/forms/field";
import { apiRequest, ClientApiError } from "@/lib/client";

export function ReviewForm({ applicationId, caregiverName }: { applicationId: string; caregiverName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/reviews", {
        method: "POST",
        body: {
          applicationId,
          rating,
          title: String(form.get("title") ?? ""),
          body: String(form.get("body") ?? ""),
        },
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not publish the review.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Leave a review</Button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-sand-50 p-3">
      <Field label={`Rating for ${caregiverName}`} required>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)}
              className={`h-9 w-9 rounded-lg border text-sm font-semibold ${rating >= value ? "border-amber-400 bg-amber-400 text-white" : "border-border bg-white"}`}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}>
              {value}
            </button>
          ))}
        </div>
      </Field>
      <Input name="title" placeholder="Short headline (optional)" />
      <textarea name="body" rows={3} required minLength={30}
        placeholder="What was it like working with this caregiver?"
        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <FormError message={error} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Publishing…" : "Publish review"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
