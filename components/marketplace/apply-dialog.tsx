"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { apiRequest, ClientApiError, uploadFile } from "@/lib/client";

export function ApplyDialog({
  jobSlug,
  jobTitle,
  isAuthenticated,
  canApply,
  alreadyApplied,
  profileIncomplete,
}: {
  jobSlug: string;
  jobTitle: string;
  isAuthenticated: boolean;
  canApply: boolean;
  alreadyApplied: boolean;
  profileIncomplete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={`/login?next=/care-jobs/${jobSlug}`}>Sign in to apply</Link>
      </Button>
    );
  }

  if (alreadyApplied) {
    return (
      <Button size="lg" variant="secondary" className="w-full" disabled>
        Application submitted
      </Button>
    );
  }

  if (!canApply) {
    return (
      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled>
          Caregiver accounts can apply
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You are signed in with a non-caregiver account.
        </p>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      let documentId: string | undefined;
      if (file) {
        const uploaded = await uploadFile(file, "JOB_ATTACHMENT");
        documentId = uploaded.id;
      }
      await apiRequest(`/api/jobs/${jobSlug}/apply`, {
        method: "POST",
        body: {
          message,
          expectedRateCents: rate ? Math.round(Number(rate) * 100) : null,
          availableFrom: availableFrom || "",
          documentId,
        },
      });
      toast.success("Application sent");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "Application could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          if (profileIncomplete) {
            toast.error("Publish your caregiver profile before applying.");
            router.push("/dashboard/caregiver/profile");
            return;
          }
          setOpen(true);
        }}
      >
        Apply for this job
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Your profile and message are shared with the family.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Apply: {jobTitle}</DialogTitle>
            <DialogDescription>
              Keep it specific — families read the message first. Mention your experience, your
              availability and why this role fits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Your message" htmlFor="apply-message" required hint="At least 40 characters">
              <Textarea
                id="apply-message"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={4000}
                placeholder="Hello, I have six years of experience with toddlers and I am available Monday to Friday…"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expected hourly rate ($)" htmlFor="apply-rate">
                <Input
                  id="apply-rate"
                  type="number"
                  min={0}
                  step={0.5}
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  placeholder="25"
                />
              </Field>
              <Field label="Available from" htmlFor="apply-date">
                <Input
                  id="apply-date"
                  type="date"
                  value={availableFrom}
                  onChange={(event) => setAvailableFrom(event.target.value)}
                />
              </Field>
            </div>

            <Field
              label="Supporting document (optional)"
              htmlFor="apply-file"
              hint="PDF or image, up to 8MB. Only the family and you can access it."
            >
              <Input
                id="apply-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || message.trim().length < 40}>
                {submitting ? "Sending…" : "Send application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
