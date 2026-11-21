"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ClientApiError } from "@/lib/client";

type Plan = {
  id: string; slug: string; name: string; audience: string; tagline: string | null;
  priceMonthlyCents: number; priceAnnualCents: number; features: string[];
  searchLimit: number | null; applicationLimit: number | null; contactLimit: number | null;
  jobPostLimit: number | null; trialDays: number; isActive: boolean; isPopular: boolean; sortOrder: number;
};

export function PlanEditor({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const num = (key: string) => Number(form.get(key) ?? 0);
    const numOrNull = (key: string) => (String(form.get(key) ?? "").trim() ? Number(form.get(key)) : null);

    try {
      await apiRequest("/api/admin/content", {
        method: "PATCH",
        body: {
          resource: "plans",
          id: plan.id,
          data: {
            slug: plan.slug,
            name: String(form.get("name") ?? ""),
            audience: plan.audience,
            tagline: String(form.get("tagline") ?? ""),
            priceMonthlyCents: num("priceMonthlyCents"),
            priceAnnualCents: num("priceAnnualCents"),
            features: String(form.get("features") ?? "").split("\n").map((value) => value.trim()).filter(Boolean),
            searchLimit: numOrNull("searchLimit"),
            applicationLimit: numOrNull("applicationLimit"),
            contactLimit: numOrNull("contactLimit"),
            jobPostLimit: numOrNull("jobPostLimit"),
            trialDays: num("trialDays"),
            isActive: form.get("isActive") === "on",
            isPopular: form.get("isPopular") === "on",
            sortOrder: num("sortOrder"),
          },
        },
      });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not save the plan.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Edit</Button>;
  }

  return (
    <form onSubmit={save} className="mt-3 grid gap-2 rounded-xl border border-border bg-sand-50 p-3 sm:grid-cols-2">
      <Input name="name" defaultValue={plan.name} placeholder="Plan name" required />
      <Input name="tagline" defaultValue={plan.tagline ?? ""} placeholder="Tagline" />
      <label className="text-xs">Monthly price (cents)
        <Input name="priceMonthlyCents" type="number" min={0} defaultValue={plan.priceMonthlyCents} />
      </label>
      <label className="text-xs">Annual price (cents)
        <Input name="priceAnnualCents" type="number" min={0} defaultValue={plan.priceAnnualCents} />
      </label>
      {[
        ["searchLimit", "Search limit", plan.searchLimit],
        ["applicationLimit", "Application limit", plan.applicationLimit],
        ["contactLimit", "Contact limit", plan.contactLimit],
        ["jobPostLimit", "Job post limit", plan.jobPostLimit],
      ].map(([key, label, value]) => (
        <label key={key as string} className="text-xs">{label as string} (blank = unlimited)
          <Input name={key as string} type="number" min={0} defaultValue={value == null ? "" : String(value)} />
        </label>
      ))}
      <label className="text-xs">Trial days
        <Input name="trialDays" type="number" min={0} defaultValue={plan.trialDays} />
      </label>
      <label className="text-xs">Sort order
        <Input name="sortOrder" type="number" min={0} defaultValue={plan.sortOrder} />
      </label>
      <label className="text-xs sm:col-span-2">Features (one per line)
        <textarea name="features" rows={4} defaultValue={plan.features.join("\n")}
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
      </label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="isActive" defaultChecked={plan.isActive} /> Active</label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="isPopular" defaultChecked={plan.isPopular} /> Popular</label>
      {error ? <p className="text-xs text-destructive sm:col-span-2">{error}</p> : null}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save plan"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
