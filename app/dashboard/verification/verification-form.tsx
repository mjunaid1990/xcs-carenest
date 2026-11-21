"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError, FormSuccess } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, uploadFile, ClientApiError } from "@/lib/client";

const CHECKS = [
  { value: "IDENTITY", label: "Government ID", hint: "A passport, driver's licence or state ID." },
  { value: "BACKGROUND_CHECK", label: "Background check", hint: "A report from an approved screening provider." },
  { value: "QUALIFICATION", label: "Qualification", hint: "CPR, first aid, teaching or nursing certificates." },
  { value: "REFERENCE", label: "Reference", hint: "Contact details for a previous family or employer." },
  { value: "AGENCY_LICENSE", label: "Agency licence", hint: "Your state business or care licence." },
];

export function VerificationForm() {
  const router = useRouter();
  const [type, setType] = useState("IDENTITY");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setErrors({}); setFormError(undefined); setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    const file = form.get("file");

    try {
      let documentId: string | undefined;
      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadFile(file, type === "AGENCY_LICENSE" ? "AGENCY_LICENSE" : type === "QUALIFICATION" ? "CERTIFICATE" : "ID_DOCUMENT");
        documentId = uploaded.id;
      }
      await apiRequest("/api/verification", {
        method: "POST",
        body: {
          type,
          documentId: documentId ?? "",
          fullLegalName: String(form.get("fullLegalName") ?? ""),
          notes: String(form.get("notes") ?? ""),
        },
      });
      setSuccess("Request submitted. Our trust and safety team will review it and notify you.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) { setErrors(error.fieldErrors); setFormError(error.message); }
      else setFormError("Could not submit the request.");
    } finally { setPending(false); }
  }

  const selected = CHECKS.find((check) => check.value === type)!;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold">Request a verification</h2>
      <FormError message={formError} />
      <FormSuccess message={success} />
      <Field label="Check type" required hint={selected.hint}>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CHECKS.map((check) => <SelectItem key={check.value} value={check.value}>{check.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Full legal name" htmlFor="fullLegalName" hint="Must match your document.">
        <Input id="fullLegalName" name="fullLegalName" />
      </Field>
      <Field label="Document" htmlFor="file" hint="PDF, JPG, PNG or WebP. Stored privately and only visible to our review team.">
        <input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="block w-full text-sm" />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" rows={3}
          className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Anything the review team should know." />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? <Spinner /> : null} Submit for review</Button>
    </form>
  );
}
