import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { WithdrawButton } from "@/components/dashboard/withdraw-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_LABELS } from "@/lib/presentation";
import { formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaregiverApplicationsPage() {
  const user = await requireRole("CAREGIVER");
  const applications = await prisma.jobApplication.findMany({
    where: { caregiver: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: { title: true, slug: true, city: true, state: true, status: true, budgetType: true, budgetMinCents: true, budgetMaxCents: true },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="My applications"
        description="Track every job you applied for and withdraw if plans change."
        action={{ href: "/care-jobs", label: "Find more jobs" }}
      />

      {!applications.length ? (
        <EmptyState
          title="No applications yet"
          description="Browse open care jobs and apply with a short, personal message."
          action={{ href: "/care-jobs", label: "Browse jobs" }}
          icon="search"
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <article key={application.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    <Link href={`/care-jobs/${application.job.slug}`} className="hover:text-primary">{application.job.title}</Link>
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {application.job.city}, {application.job.state} ·{" "}
                    {formatMoney(application.job.budgetMinCents)}
                    {application.job.budgetType === "HOURLY" ? "/hr" : application.job.budgetType === "DAILY" ? "/day" : "/mo"} ·
                    Applied {timeAgo(application.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={application.status === "HIRED" ? "success" : application.status === "REJECTED" ? "muted" : "secondary"}>
                    {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
                  </Badge>
                  {!["HIRED", "WITHDRAWN"].includes(application.status) ? (
                    <WithdrawButton applicationId={application.id} />
                  ) : null}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 rounded-xl bg-sand-50 p-3 text-[13px] leading-6 text-ink-500">{application.message}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
