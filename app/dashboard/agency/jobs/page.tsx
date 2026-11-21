import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { JobActions } from "@/components/dashboard/job-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { budgetLabel, JOB_STATUS_LABELS } from "@/lib/presentation";

export const dynamic = "force-dynamic";

export default async function AgencyJobsPage() {
  const user = await requireRole("AGENCY");
  const jobs = await prisma.careJob.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  return (
    <div>
      <PageHeader title="Agency jobs" description="Everything your agency has posted." action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }} />
      {!jobs.length ? (
        <EmptyState title="No jobs yet" description="Post your first role to start receiving applications." action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }} />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
              <div>
                <h2 className="text-base font-semibold">
                  <Link href={`/care-jobs/${job.slug}`} className="hover:text-primary">{job.title}</Link>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {job.category.name} · {job.city}, {job.state} · {budgetLabel(job)} · {job._count.applications} applicants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={job.status === "PUBLISHED" ? "success" : "muted"}>{JOB_STATUS_LABELS[job.status] ?? job.status}</Badge>
                <Link href={`/dashboard/family/jobs/${job.id}/applications`} className="text-xs font-semibold text-primary hover:underline">Applicants</Link>
                <JobActions jobId={job.id} status={job.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
