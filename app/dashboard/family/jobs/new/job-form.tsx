"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";

type Category = { slug: string; name: string };

const EMPLOYMENT = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "OCCASIONAL", label: "Occasional" },
];
const LIVING = [
  { value: "LIVE_OUT", label: "Live-out" },
  { value: "LIVE_IN", label: "Live-in" },
];
const BUDGET = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
  { value: "MONTHLY", label: "Monthly" },
];

export function JobForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [livingArrangement, setLivingArrangement] = useState("LIVE_OUT");
  const [budgetType, setBudgetType] = useState("HOURLY");
  const [status, setStatus] = useState("PUBLISHED");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(undefined);
    const form = new FormData(event.currentTarget);
    const num = (key: string) => Number(form.get(key) ?? 0);

    const payload = {
      title: String(form.get("title") ?? ""),
      categorySlug: category,
      description: String(form.get("description") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      zip: String(form.get("zip") ?? ""),
      employmentType,
      livingArrangement,
      schedule: String(form.get("schedule") ?? ""),
      startDate: String(form.get("startDate") ?? ""),
      durationMonths: num("durationMonths") || undefined,
      budgetType,
      budgetMin: num("budgetMin"),
      budgetMax: num("budgetMax") || undefined,
      caregiversNeeded: num("caregiversNeeded") || 1,
      experienceYears: num("experienceYears") || 0,
      requirements: String(form.get("requirements") ?? "")
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      status,
    };

    try {
      const created = await apiRequest<{ id: string; slug: string }>("/api/jobs", {
        method: "POST",
        body: payload,
      });
      router.push(status === "PUBLISHED" ? `/care-jobs/${created.slug}` : "/dashboard/family/jobs");
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not create the job. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border/70 bg-white p-5 shadow-soft sm:p-6" noValidate>
      <FormError message={formError} />
      <Field label="Job title" htmlFor="title" error={errors.title} required hint="E.g. “Full-time nanny for two children in Boston”.">
        <Input id="title" name="title" placeholder="Full-time nanny" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Care category" required>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Schedule" htmlFor="schedule" error={errors.schedule} required>
          <Input id="schedule" name="schedule" placeholder="Mon–Fri, 8am–5pm" />
        </Field>
      </div>
      <Field label="Description" htmlFor="description" error={errors.description} required hint="What the role involves, who is in the household and what a great match looks like.">
        <textarea id="description" name="description" rows={6}
          className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Describe the role, the children or client, and your expectations." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={errors.city} required><Input id="city" name="city" /></Field>
        <Field label="State" htmlFor="state" error={errors.state} required><Input id="state" name="state" /></Field>
        <Field label="ZIP" htmlFor="zip"><Input id="zip" name="zip" /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Employment type" required>
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EMPLOYMENT.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Living arrangement" required>
          <Select value={livingArrangement} onValueChange={setLivingArrangement}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LIVING.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Budget type" required>
          <Select value={budgetType} onValueChange={setBudgetType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{BUDGET.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Minimum ($)" htmlFor="budgetMin" error={errors.budgetMin} required><Input id="budgetMin" name="budgetMin" type="number" min={0} step="0.01" /></Field>
        <Field label="Maximum ($)" htmlFor="budgetMax" error={errors.budgetMax}><Input id="budgetMax" name="budgetMax" type="number" min={0} step="0.01" /></Field>
        <Field label="Caregivers needed" htmlFor="caregiversNeeded"><Input id="caregiversNeeded" name="caregiversNeeded" type="number" min={1} defaultValue={1} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start date" htmlFor="startDate"><Input id="startDate" name="startDate" type="date" /></Field>
        <Field label="Duration (months)" htmlFor="durationMonths"><Input id="durationMonths" name="durationMonths" type="number" min={0} /></Field>
        <Field label="Experience required (years)" htmlFor="experienceYears"><Input id="experienceYears" name="experienceYears" type="number" min={0} defaultValue={0} /></Field>
      </div>
      <Field label="Requirements" htmlFor="requirements" hint="One requirement per line.">
        <textarea id="requirements" name="requirements" rows={3}
          className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder={"CPR certified\nComfortable with dogs\nNon-smoker"} />
      </Field>
      <Field label="Visibility" required>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
          </SelectContent>
        </Select>
      </Field>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? <Spinner /> : null} {status === "PUBLISHED" ? "Publish job" : "Save draft"}</Button>
      </div>
    </form>
  );
}
