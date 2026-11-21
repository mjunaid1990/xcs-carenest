import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/presentation";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgencyDashboard() {
  const user = await requireRole("AGENCY");
  const agency = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });

  const [jobs, caregiverCount, applications] = await Promise.all([
    prisma.careJob.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: { select: { name: true } }, _count: { select: { applications: true } } },
    }),
    agency ? prisma.caregiverProfile.count({ where: { agencyId: agency.id, deletedAt: null } }) : 0,
    prisma.jobApplication.count({ where: { job: { ownerId: user.id } } }),
  ]);

  return (
    <div>
      <PageHeader
        title={agency?.name ?? "Agency dashboard"}
        description="Manage your job posts and the caregivers linked to your agency."
        action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active jobs" value={jobs.filter((job) => job.status === "PUBLISHED").length} />
        <StatCard label="Applications" value={applications} />
        <StatCard label="Agency caregivers" value={caregiverCount} />
      </div>

      {!agency ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Add your agency details in <Link href="/dashboard/settings" className="font-semibold underline">settings</Link> so families can see who you are.
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent jobs</h2>
          <Link href="/dashboard/agency/jobs" className="text-xs font-semibold text-primary hover:underline">View all</Link>
        </div>
        {jobs.length ? (
          <ul className="divide-y divide-border/60">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/care-jobs/${job.slug}`} className="text-sm font-medium hover:text-primary">{job.title}</Link>
                  <p className="text-xs text-muted-foreground">
                    {job.category.name} · {job._count.applications} applicants · {timeAgo(job.createdAt)}
                  </p>
                </div>
                <Badge variant={job.status === "PUBLISHED" ? "success" : "muted"}>{JOB_STATUS_LABELS[job.status] ?? job.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No jobs yet. Post one to start receiving applications.</p>
        )}
      </section>
    </div>
  );
}
