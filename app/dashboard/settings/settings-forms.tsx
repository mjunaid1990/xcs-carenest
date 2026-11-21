"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormSuccess } from "@/components/forms/field";
import { Spinner } from "@/components/ui/feedback";
import { apiRequest, ClientApiError } from "@/lib/client";

type Account = {
  firstName: string; lastName: string; phone: string; timezone: string;
  city: string; state: string; zip: string;
};
type Prefs = {
  emailApplications: boolean; emailMessages: boolean; emailInterviews: boolean;
  emailBilling: boolean; emailReviews: boolean; emailMarketing: boolean; inAppEnabled: boolean;
};

export function AccountForm({ account, prefs }: { account: Account; prefs: Prefs }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState(prefs);

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setErrors({}); setFormError(undefined); setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/account", {
        method: "PATCH",
        body: {
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          timezone: String(form.get("timezone") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          zip: String(form.get("zip") ?? ""),
        },
      });
      setSuccess("Account details saved.");
      router.refresh();
    } catch (error) {
      if (error instanceof ClientApiError) { setErrors(error.fieldErrors); setFormError(error.message); }
      else setFormError("Could not save your account.");
    } finally { setPending(false); }
  }

  async function savePrefs() {
    setPending(true); setFormError(undefined); setSuccess(undefined);
    try {
      await apiRequest("/api/account", { method: "PATCH", body: { kind: "notifications", ...values } });
      setSuccess("Notification preferences saved.");
    } catch (error) {
      setFormError(error instanceof ClientApiError ? error.message : "Could not save preferences.");
    } finally { setPending(false); }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setErrors({}); setFormError(undefined); setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/account/password", {
        method: "POST",
        body: {
          currentPassword: String(form.get("currentPassword") ?? ""),
          password: String(form.get("password") ?? ""),
          confirmPassword: String(form.get("confirmPassword") ?? ""),
        },
      });
      setSuccess("Password updated. Other sessions were signed out.");
      event.currentTarget.reset();
    } catch (error) {
      if (error instanceof ClientApiError) { setErrors(error.fieldErrors); setFormError(error.message); }
      else setFormError("Could not update your password.");
    } finally { setPending(false); }
  }

  return (
    <div className="space-y-6">
      <FormError message={formError} />
      <FormSuccess message={success} />

      <form onSubmit={saveAccount} className="space-y-4 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold">Account details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName} required><Input id="firstName" name="firstName" defaultValue={account.firstName} /></Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName} required><Input id="lastName" name="lastName" defaultValue={account.lastName} /></Field>
          <Field label="Phone" htmlFor="phone"><Input id="phone" name="phone" defaultValue={account.phone} /></Field>
          <Field label="Timezone" htmlFor="timezone" error={errors.timezone} required><Input id="timezone" name="timezone" defaultValue={account.timezone} /></Field>
          <Field label="City" htmlFor="city"><Input id="city" name="city" defaultValue={account.city} /></Field>
          <Field label="State" htmlFor="state"><Input id="state" name="state" defaultValue={account.state} /></Field>
          <Field label="ZIP" htmlFor="zip"><Input id="zip" name="zip" defaultValue={account.zip} /></Field>
        </div>
        <Button type="submit" disabled={pending}>{pending ? <Spinner /> : null} Save details</Button>
      </form>

      <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold">Email and in-app notifications</h2>
        {([
          ["emailApplications", "Applications and hiring updates"],
          ["emailMessages", "New messages"],
          ["emailInterviews", "Interview invitations and changes"],
          ["emailBilling", "Billing and subscription receipts"],
          ["emailReviews", "New reviews"],
          ["emailMarketing", "Product news and tips"],
          ["inAppEnabled", "Show in-app notifications"],
        ] as [keyof Prefs, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values[key]} className="h-4 w-4"
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.checked }))} />
            {label}
          </label>
        ))}
        <Button size="sm" onClick={savePrefs} disabled={pending}>Save preferences</Button>
      </div>

      <form onSubmit={changePassword} className="space-y-4 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold">Change password</h2>
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword} required>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" htmlFor="password" error={errors.password} required>
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>Update password</Button>
      </form>
    </div>
  );
}
