import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { JobActions } from "@/components/dashboard/job-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { budgetLabel, JOB_STATUS_LABELS } from "@/lib/presentation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FamilyJobsPage() {
  const user = await requireRole("FAMILY");
  const jobs = await prisma.careJob.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="My care jobs"
        description="Draft, publish and close the roles you are hiring for."
        action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }}
      />

      {!jobs.length ? (
        <EmptyState
          title="No jobs yet"
          description="Create a job to tell caregivers what you need. Published jobs are searchable immediately."
          action={{ href: "/dashboard/family/jobs/new", label: "Post your first job" }}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">
                      <Link href={`/care-jobs/${job.slug}`} className="hover:text-primary">{job.title}</Link>
                    </h2>
                    <Badge variant={job.status === "PUBLISHED" ? "success" : job.status === "DRAFT" ? "muted" : "secondary"}>
                      {JOB_STATUS_LABELS[job.status] ?? job.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.category.name} · {job.city}, {job.state} · {budgetLabel(job)} · Posted {formatDate(job.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/family/jobs/${job.id}/applications`}
                    className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
                  >
                    {job._count.applications} applicant{job._count.applications === 1 ? "" : "s"}
                  </Link>
                  <JobActions jobId={job.id} status={job.status} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
