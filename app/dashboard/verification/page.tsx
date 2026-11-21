import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { VerificationForm } from "./verification-form";
import { Badge } from "@/components/ui/badge";
import { VERIFICATION_LABELS } from "@/lib/presentation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  IDENTITY: "Government ID",
  BACKGROUND_CHECK: "Background check",
  QUALIFICATION: "Qualifications",
  REFERENCE: "References",
  AGENCY_LICENSE: "Agency licence",
  PHONE: "Phone",
};

export default async function VerificationPage() {
  const user = await requireUser();
  const [requests, caregiver, agency] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, status: true, reviewNote: true, createdAt: true, decidedAt: true },
    }),
    user.role === "CAREGIVER" ? prisma.caregiverProfile.findUnique({ where: { userId: user.id } }) : null,
    user.role === "AGENCY" ? prisma.agencyProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  const checks = caregiver
    ? [
        { label: "Identity", done: Boolean(caregiver.identityVerifiedAt) },
        { label: "Background check", done: Boolean(caregiver.backgroundCheckAt) },
        { label: "Qualifications", done: Boolean(caregiver.qualificationsVerifiedAt) },
        { label: "References", done: Boolean(caregiver.referencesVerifiedAt) },
      ]
    : agency
      ? [{ label: "Agency licence", done: Boolean(agency.licenseVerifiedAt) }]
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Verification"
        description="Badges only appear after a real check is completed by our review team. Documents are private."
      />

      {caregiver ? (
        <div className="mb-6 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Your checks</h2>
            <Badge variant={caregiver.verificationStatus === "VERIFIED" ? "success" : caregiver.verificationStatus === "PENDING" ? "warning" : "muted"}>
              {VERIFICATION_LABELS[caregiver.verificationStatus] ?? caregiver.verificationStatus}
            </Badge>
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                <span className={check.done ? "text-emerald-600" : "text-muted-foreground"}>{check.done ? "✓" : "○"}</span>
                <span className={check.done ? "text-ink-700" : "text-muted-foreground"}>{check.label}</span>
              </li>
            ))}
          </ul>
          {caregiver.verificationNote ? <p className="mt-3 rounded-xl bg-sand-50 p-3 text-xs text-ink-500">{caregiver.verificationNote}</p> : null}
        </div>
      ) : null}

      <div className="mb-6">
        <VerificationForm />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Your requests</h2>
        {requests.length ? (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-white shadow-soft">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium">{TYPE_LABELS[request.type] ?? request.type}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(request.createdAt)}
                    {request.decidedAt ? ` · Decided ${formatDate(request.decidedAt)}` : ""}
                  </p>
                  {request.reviewNote ? <p className="mt-1 text-xs text-ink-500">{request.reviewNote}</p> : null}
                </div>
                <Badge variant={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "destructive" : request.status === "INFO_REQUESTED" ? "warning" : "secondary"}>
                  {request.status.replace("_", " ").toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No verification requests yet.</p>
        )}
      </section>
    </div>
  );
}
