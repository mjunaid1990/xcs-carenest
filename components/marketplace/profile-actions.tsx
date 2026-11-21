"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea, NativeSelect } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { apiRequest, ClientApiError } from "@/lib/client";
import { REPORT_REASONS } from "@/lib/presentation";

export function ProfileActions({
  caregiverId,
  caregiverName,
  isAuthenticated,
  isOwner,
  contactAllowed,
}: {
  caregiverId: string;
  caregiverName: string;
  isAuthenticated: boolean;
  isOwner: boolean;
  contactAllowed: boolean;
}) {
  const router = useRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [reason, setReason] = useState("safety_concern");
  const [details, setDetails] = useState("");

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${caregiverName} on CareNest`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      /* user cancelled */
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await apiRequest<{ conversationId: string }>("/api/messages/conversations", {
        method: "POST",
        body: { recipientId: caregiverId, message },
      });
      toast.success("Message sent");
      setContactOpen(false);
      setMessage("");
      router.push("/dashboard/messages");
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/api/reports", {
        method: "POST",
        body: {
          targetType: "USER",
          targetUserId: caregiverId,
          reason,
          details,
        },
      });
      toast.success("Report submitted. Our trust & safety team will review it.");
      setReportOpen(false);
      setDetails("");
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "Report could not be submitted.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isOwner ? (
        <Button asChild>
          <Link href="/dashboard/caregiver/profile">Edit my profile</Link>
        </Button>
      ) : (
        <Button
          onClick={() => {
            if (!isAuthenticated) {
              router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
              return;
            }
            setContactOpen(true);
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {contactAllowed ? "Contact caregiver" : "Upgrade to contact"}
        </Button>
      )}
      <Button variant="outline" onClick={share}>
        <Share2 className="h-4 w-4" /> Share
      </Button>
      {!isOwner ? (
        <Button
          variant="ghost"
          onClick={() => {
            if (!isAuthenticated) {
              router.push("/login");
              return;
            }
            setReportOpen(true);
          }}
        >
          <Flag className="h-4 w-4" /> Report
        </Button>
      ) : null}

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {caregiverName}</DialogTitle>
            <DialogDescription>
              Introduce yourself, describe the care you need and share your timeline. Contact details
              stay private until you choose to share them.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendMessage} className="space-y-4">
            <Field label="Your message" htmlFor="contact-message" required>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                placeholder="Hi, we are looking for weekday care for our two children…"
                maxLength={2000}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending || message.trim().length < 10}>
                {sending ? "Sending…" : "Send message"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this profile</DialogTitle>
            <DialogDescription>
              Reports are private. Our trust &amp; safety team reviews every one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReport} className="space-y-4">
            <Field label="What is the problem?" htmlFor="report-reason" required>
              <NativeSelect
                id="report-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {Object.entries(REPORT_REASONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Details" htmlFor="report-details" required hint="At least 20 characters">
              <Textarea
                id="report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={5}
                maxLength={2000}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={details.trim().length < 20}>
                Submit report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
