"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FormError, FormSuccess } from "@/components/forms/field";
import { apiRequest, ClientApiError } from "@/lib/client";
import { contactSchema } from "@/lib/validators";
import { Spinner } from "@/components/ui/feedback";

const TOPICS = [
  { value: "support", label: "Account or product support" },
  { value: "safety", label: "Safety concern" },
  { value: "billing", label: "Billing or subscriptions" },
  { value: "press", label: "Press and partnerships" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const params = useSearchParams();
  const initialTopic = params.get("topic") ?? "support";
  const [topic, setTopic] = useState(TOPICS.some((t) => t.value === initialTopic) ? initialTopic : "support");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(undefined);
    setSuccess(undefined);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      topic,
      message: String(form.get("message") ?? ""),
    };

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
      setErrors(fieldErrors);
      setPending(false);
      return;
    }

    try {
      await apiRequest("/api/contact", { method: "POST", body: parsed.data });
      setSuccess("Thanks — your message is on its way. We usually reply within one business day.");
      event.currentTarget.reset();
    } catch (error) {
      if (error instanceof ClientApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("We could not send your message. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? <FormError message={formError} /> : null}
      {success ? <FormSuccess message={success} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={errors.name} required>
          <Input id="name" name="name" autoComplete="name" placeholder="Alex Morgan" />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email} required>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="Topic" htmlFor="topic" required>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="topic"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TOPICS.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="How can we help?" htmlFor="message" error={errors.message} required hint="Please do not include passwords or ID numbers.">
        <textarea
          id="message"
          name="message"
          rows={6}
          className="flex w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Tell us what happened and include any relevant details."
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : <Send className="h-4 w-4" />}
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
