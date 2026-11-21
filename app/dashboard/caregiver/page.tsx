import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caregiverCompletion } from "@/lib/profile-completion";
import { getUsage } from "@/lib/subscription";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/feedback";
import { APPLICATION_STATUS_LABELS } from "@/lib/presentation";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaregiverDashboard() {
  const user = await requireRole("CAREGIVER");
  const profile = await prisma.caregiverProfile.findUnique({ where: { userId: user.id } });

  const [applications, interviews, savedJobs, usage] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { caregiver: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { job: { select: { title: true, slug: true, city: true, state: true } } },
    }),
    prisma.interview.findMany({
      where: { caregiverId: user.id, scheduledAt: { gte: new Date() }, status: { not: "CANCELLED" } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: { job: { select: { title: true } } },
    }),
    prisma.savedJob.count({ where: { userId: user.id } }),
    getUsage(user.id, user.role),
  ]);

  const completion = profile
    ? await caregiverCompletion(profile.id, user.id)
    : { percent: 0, steps: [] as { key: string; label: string; done: boolean }[] };

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.firstName}`}
        description="Keep your profile current — families see it in search results."
        action={{ href: "/dashboard/caregiver/profile", label: "Edit profile" }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={applications.length} hint={`${usage.applications} this period`} />
        <StatCard label="Profile views" value={profile?.profileViews ?? 0} />
        <StatCard label="Rating" value={profile?.ratingCount ? `${profile.ratingAvg.toFixed(1)} / 5` : "No reviews"} hint={`${profile?.ratingCount ?? 0} reviews`} />
        <StatCard label="Saved jobs" value={savedJobs} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Profile strength</h2>
            <span className="text-sm font-semibold text-primary">{completion.percent}%</span>
          </div>
          <Progress value={completion.percent} />
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {completion.steps.map((step) => (
              <li key={step.key} className="flex items-center gap-2 text-[13px]">
                <span className={step.done ? "text-emerald-600" : "text-muted-foreground"}>{step.done ? "✓" : "○"}</span>
                <span className={step.done ? "text-ink-700" : "text-muted-foreground"}>{step.label}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/caregiver/profile" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Complete your profile →
          </Link>
        </section>

        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Upcoming interviews</h2>
          {interviews.length ? (
            <ul className="space-y-2">
              {interviews.map((interview) => (
                <li key={interview.id} className="rounded-xl bg-sand-50 px-3 py-2.5 text-sm">
                  <p className="font-medium">{interview.job?.title ?? "Interview"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(interview.scheduledAt, { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                    {formatDate(interview.scheduledAt, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing scheduled. Families can invite you after reviewing your application.</p>
          )}
          <Link href="/dashboard/interviews" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">All interviews →</Link>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent applications</h2>
          <Link href="/dashboard/caregiver/applications" className="text-xs font-semibold text-primary hover:underline">View all</Link>
        </div>
        {applications.length ? (
          <ul className="divide-y divide-border/60">
            {applications.map((application) => (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/care-jobs/${application.job.slug}`} className="text-sm font-medium hover:text-primary">{application.job.title}</Link>
                  <p className="text-xs text-muted-foreground">{application.job.city}, {application.job.state} · {timeAgo(application.createdAt)}</p>
                </div>
                <Badge variant={application.status === "HIRED" ? "success" : application.status === "REJECTED" ? "muted" : "secondary"}>
                  {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You have not applied yet. <Link href="/care-jobs" className="text-primary hover:underline">Browse care jobs</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
