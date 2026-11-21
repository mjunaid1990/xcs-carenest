"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";

type Values = Record<string, string>;

export function RoleProfileForm({ role, initial }: { role: string; initial: Values }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setErrors({}); setFormError(undefined); setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries()) as Record<string, string>;
    const body =
      role === "FAMILY"
        ? { ...raw, childrenCount: Number(raw.childrenCount ?? 0) }
        : raw;

    try {
      await apiRequest("/api/profile", { method: "PATCH", body });
      setSuccess("Profile saved.");
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) { setErrors(error.fieldErrors); setFormError(error.message); }
      else setFormError("Could not save your profile.");
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
      <div>
        <h2 className="text-base font-semibold">{role === "AGENCY" ? "Agency profile" : "Family profile"}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {role === "AGENCY" ? "Shown on your job posts so families know who they are dealing with." : "Helps caregivers understand your household before they apply or reply."}
        </p>
      </div>
      <FormError message={formError} />
      <FormSuccess message={success} />

      {role === "AGENCY" ? (
        <>
          <Field label="Agency name" htmlFor="name" error={errors.name} required><Input id="name" name="name" defaultValue={initial.name} /></Field>
          <Field label="About the agency" htmlFor="about" error={errors.about}>
            <textarea id="about" name="about" rows={4} defaultValue={initial.about}
              className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" htmlFor="website" error={errors.website}><Input id="website" name="website" defaultValue={initial.website} placeholder="https://" /></Field>
            <Field label="Contact phone" htmlFor="contactPhone"><Input id="contactPhone" name="contactPhone" defaultValue={initial.contactPhone} /></Field>
            <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail}><Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} /></Field>
            <Field label="License number" htmlFor="licenseNumber"><Input id="licenseNumber" name="licenseNumber" defaultValue={initial.licenseNumber} /></Field>
          </div>
        </>
      ) : (
        <>
          <Field label="Household headline" htmlFor="headline" error={errors.headline}><Input id="headline" name="headline" defaultValue={initial.headline} placeholder="Family of four in Brookline" /></Field>
          <Field label="About your family" htmlFor="about" error={errors.about}>
            <textarea id="about" name="about" rows={4} defaultValue={initial.about}
              className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Children" htmlFor="childrenCount" error={errors.childrenCount}><Input id="childrenCount" name="childrenCount" type="number" min={0} defaultValue={initial.childrenCount || "0"} /></Field>
            <Field label="Emergency contact" htmlFor="emergencyContact"><Input id="emergencyContact" name="emergencyContact" defaultValue={initial.emergencyContact} /></Field>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" htmlFor="city" error={errors.city} required><Input id="city" name="city" defaultValue={initial.city} /></Field>
        <Field label="State" htmlFor="state" error={errors.state} required><Input id="state" name="state" defaultValue={initial.state} /></Field>
        <Field label="ZIP" htmlFor="zip" error={errors.zip} required><Input id="zip" name="zip" defaultValue={initial.zip} /></Field>
      </div>
      {role === "AGENCY" ? <input type="hidden" name="addressLine" value={initial.addressLine ?? ""} /> : null}

      <Button type="submit" disabled={pending}>{pending ? <Spinner /> : null} Save profile</Button>
    </form>
  );
}
