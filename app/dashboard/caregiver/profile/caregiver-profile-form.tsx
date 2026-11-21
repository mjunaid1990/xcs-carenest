"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError, FormSuccess } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";

type Category = { slug: string; name: string };

export type CaregiverProfileValues = {
  headline: string;
  bio: string;
  city: string;
  state: string;
  zip: string;
  yearsExperience: number;
  hourlyRateCents: number | null;
  rateType: string;
  employmentType: string;
  livingArrangement: string;
  languages: string[];
  categories: string[];
  isPublished: boolean;
  availableForWork: boolean;
};

export function CaregiverProfileForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial: CaregiverProfileValues;
}) {
  const router = useRouter();
  const [rateType, setRateType] = useState(initial.rateType);
  const [employmentType, setEmploymentType] = useState(initial.employmentType);
  const [living, setLiving] = useState(initial.livingArrangement);
  const [selected, setSelected] = useState<string[]>(initial.categories);
  const [published, setPublished] = useState(initial.isPublished);
  const [available, setAvailable] = useState(initial.availableForWork);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug]
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(undefined);
    setSuccess(undefined);
    const form = new FormData(event.currentTarget);

    const payload = {
      headline: String(form.get("headline") ?? ""),
      bio: String(form.get("bio") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      zip: String(form.get("zip") ?? ""),
      yearsExperience: Number(form.get("yearsExperience") ?? 0),
      hourlyRateCents: Math.round(Number(form.get("hourlyRate") ?? 0) * 100) || null,
      rateType,
      employmentType,
      livingArrangement: living,
      languages: String(form.get("languages") ?? "").split(",").map((v) => v.trim()).filter(Boolean),
      categories: selected,
      isPublished: published,
      availableForWork: available,
    };

    try {
      const result = await apiRequest<{ published: boolean }>("/api/profile", { method: "PATCH", body: payload });
      setSuccess(
        result.published
          ? "Profile saved and published. Families can now find you in search."
          : "Profile saved as a draft. Publish it when you are ready to be found."
      );
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not save your profile. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border/70 bg-white p-5 shadow-soft sm:p-6" noValidate>
      <FormError message={formError} />
      <FormSuccess message={success} />
      <Field label="Headline" htmlFor="headline" error={errors.headline} hint="One clear line, e.g. “Experienced nanny and newborn care specialist”.">
        <Input id="headline" name="headline" defaultValue={initial.headline} maxLength={140} />
      </Field>
      <Field label="About you" htmlFor="bio" error={errors.bio} hint="Experience, approach to care, and what families should know.">
        <textarea id="bio" name="bio" rows={6} defaultValue={initial.bio}
          className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={errors.city} required><Input id="city" name="city" defaultValue={initial.city} /></Field>
        <Field label="State" htmlFor="state" error={errors.state} required><Input id="state" name="state" defaultValue={initial.state} /></Field>
        <Field label="ZIP" htmlFor="zip"><Input id="zip" name="zip" defaultValue={initial.zip} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Years of experience" htmlFor="yearsExperience" error={errors.yearsExperience} required>
          <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} defaultValue={initial.yearsExperience} />
        </Field>
        <Field label="Rate ($)" htmlFor="hourlyRate" error={errors.hourlyRateCents}>
          <Input id="hourlyRate" name="hourlyRate" type="number" min={0} step="0.5" defaultValue={initial.hourlyRateCents ? initial.hourlyRateCents / 100 : ""} />
        </Field>
        <Field label="Rate type" required>
          <Select value={rateType} onValueChange={setRateType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="HOURLY">Per hour</SelectItem>
              <SelectItem value="DAILY">Per day</SelectItem>
              <SelectItem value="MONTHLY">Per month</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Availability" required>
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_TIME">Full-time</SelectItem>
              <SelectItem value="PART_TIME">Part-time</SelectItem>
              <SelectItem value="BOTH">Full or part-time</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Living arrangement" required>
          <Select value={living} onValueChange={setLiving}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LIVE_OUT">Live-out</SelectItem>
              <SelectItem value="LIVE_IN">Live-in</SelectItem>
              <SelectItem value="BOTH">Either</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Languages" htmlFor="languages" hint="Comma separated, e.g. English, Spanish, ASL.">
        <Input id="languages" name="languages" defaultValue={initial.languages.join(", ")} />
      </Field>
      <Field label="Care categories" hint="Choose every category you want to appear in.">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button key={category.slug} type="button" onClick={() => toggle(category.slug)}
              aria-pressed={selected.includes(category.slug)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected.includes(category.slug)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-ink-500 hover:bg-muted"
              }`}>
              {category.name}
            </button>
          ))}
        </div>
      </Field>
      <div className="space-y-2 rounded-xl border border-border bg-sand-50 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="h-4 w-4" />
          Publish my profile in search results
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="h-4 w-4" />
          I am currently available for work
        </label>
      </div>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={pending}>{pending ? <Spinner /> : null} Save profile</Button>
      </div>
    </form>
  );
}
