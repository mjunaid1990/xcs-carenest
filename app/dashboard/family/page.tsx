import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsage } from "@/lib/subscription";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Alert } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from "@/lib/presentation";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FamilyDashboard() {
  const user = await requireRole("FAMILY");
  const usage = await getUsage(user.id, user.role);

  const [jobs, applications, interviews, saved, profile] = await Promise.all([
    prisma.careJob.findMany({
      where: { ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: { select: { name: true } }, _count: { select: { applications: true } } },
    }),
    prisma.jobApplication.findMany({
      where: { job: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        job: { select: { title: true, slug: true } },
        caregiver: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.interview.findMany({
      where: { familyId: user.id, scheduledAt: { gte: new Date() }, status: { not: "CANCELLED" } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: { job: { select: { title: true } } },
    }),
    prisma.savedCaregiver.count({ where: { userId: user.id } }),
    prisma.familyProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description="Track your care jobs, applicants and interviews from one place."
        action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }}
      />

      {!profile?.onboardingComplete ? (
        <div className="mb-6">
          <Alert variant="info" title="Finish your family profile">
            Add your care needs and location so caregivers know who they are talking to.{" "}
            <Link href="/dashboard/settings" className="font-semibold underline">Complete profile</Link>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={jobs.filter((j) => j.status === "PUBLISHED").length} hint={`${usage.jobPosts} posted this period`} />
        <StatCard label="Applications" value={applications.length} hint="Most recent 5 shown below" />
        <StatCard label="Upcoming interviews" value={interviews.length} />
        <StatCard label="Saved caregivers" value={saved} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your jobs</h2>
            <Link href="/dashboard/family/jobs" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          {jobs.length ? (
            <ul className="divide-y divide-border/60">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/care-jobs/${job.slug}`} className="truncate text-sm font-medium hover:text-primary">{job.title}</Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {job.category.name} · {job._count.applications} applicant{job._count.applications === 1 ? "" : "s"} · {timeAgo(job.createdAt)}
                    </p>
                  </div>
                  <Badge variant={job.status === "PUBLISHED" ? "success" : "muted"}>
                    {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No jobs yet" description="Post your first care job to start receiving applications." action={{ href: "/dashboard/family/jobs/new", label: "Post a job" }} />
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent applications</h2>
          </div>
          {applications.length ? (
            <ul className="divide-y divide-border/60">
              {applications.map((application) => (
                <li key={application.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium">
                    {application.caregiver.user.firstName} {application.caregiver.user.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {application.job.title} · {timeAgo(application.createdAt)}
                  </p>
                  <Badge variant="secondary" className="mt-1.5">
                    {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No applications yet" description="Published jobs appear in search and caregivers can apply." />
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <h2 className="mb-3 text-base font-semibold">Upcoming interviews</h2>
        {interviews.length ? (
          <ul className="space-y-2">
            {interviews.map((interview) => (
              <li key={interview.id} className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2.5 text-sm">
                <span className="font-medium">{interview.job?.title ?? "Interview"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(interview.scheduledAt, { weekday: "short", month: "short", day: "numeric" })} at{" "}
                  {formatDate(interview.scheduledAt, { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No interviews scheduled. Shortlist an applicant to invite them.</p>
        )}
      </section>
    </div>
  );
}
