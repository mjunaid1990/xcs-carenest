import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ApplicationActions } from "@/components/dashboard/application-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_LABELS } from "@/lib/presentation";
import { formatDate, formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("FAMILY");
  const { id } = await params;

  const job = await prisma.careJob.findFirst({
    where: { id, ownerId: user.id, deletedAt: null },
    select: { id: true, title: true, slug: true, status: true, caregiversNeeded: true },
  });
  if (!job) notFound();

  const applications = await prisma.jobApplication.findMany({
    where: { jobId: job.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      caregiver: {
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title={`Applicants for ${job.title}`}
        description={`${applications.length} application${applications.length === 1 ? "" : "s"} · ${job.caregiversNeeded} caregiver${job.caregiversNeeded === 1 ? "" : "s"} needed`}
        action={{ href: `/care-jobs/${job.slug}`, label: "View public job" }}
      />

      {!applications.length ? (
        <EmptyState
          title="No applications yet"
          description={job.status === "PUBLISHED" ? "Your job is live. Share it to attract more caregivers." : "Publish this job so caregivers can apply."}
          action={{ href: "/dashboard/family/jobs", label: "Back to my jobs" }}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    <Link href={`/caregivers/${application.caregiver.slug}`} className="hover:text-primary">
                      {application.caregiver.user.firstName} {application.caregiver.user.lastName}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {application.caregiver.headline ?? "Caregiver"} · {application.caregiver.yearsExperience} yrs experience ·{" "}
                    {application.expectedRateCents ? `Asks ${formatMoney(application.expectedRateCents)}/hr` : "Rate negotiable"} ·{" "}
                    Applied {timeAgo(application.createdAt)}
                  </p>
                </div>
                <Badge variant={application.status === "HIRED" ? "success" : application.status === "REJECTED" ? "muted" : "secondary"}>
                  {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
                </Badge>
              </div>

              <p className="mt-3 whitespace-pre-line rounded-xl bg-sand-50 p-3 text-sm leading-6 text-ink-700">{application.message}</p>
              {application.availableFrom ? (
                <p className="mt-2 text-xs text-muted-foreground">Available from {formatDate(application.availableFrom)}</p>
              ) : null}

              <div className="mt-4 border-t border-border pt-4">
                <ApplicationActions
                  applicationId={application.id}
                  status={application.status}
                  caregiverUserId={application.caregiver.user.id}
                  jobId={job.id}
                  caregiverName={`${application.caregiver.user.firstName} ${application.caregiver.user.lastName}`}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
