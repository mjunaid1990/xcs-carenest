import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModerationAction } from "@/components/dashboard/moderation-action";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/presentation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  await requireRole("ADMIN");
  const jobs = await prisma.careJob.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      owner: { select: { firstName: true, lastName: true, email: true } },
      category: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Jobs" description="Moderate every job post. Changes take effect immediately on the public site." />
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-sand-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3">
                  <Link href={`/care-jobs/${job.slug}`} className="font-medium hover:text-primary">{job.title}</Link>
                  <p className="text-xs text-muted-foreground">
                    {job.category.name} · {job.city}, {job.state} · {job._count.applications} applicants
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {job.owner.firstName} {job.owner.lastName}
                  <p className="text-muted-foreground">{job.owner.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={job.status === "PUBLISHED" ? "success" : job.status === "CLOSED" ? "muted" : "secondary"}>
                    {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(job.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    {job.status === "PUBLISHED" ? (
                      <ModerationAction type="job" id={job.id} action="pause" status="PAUSED" label="Pause" variant="ghost" />
                    ) : (
                      <ModerationAction type="job" id={job.id} action="publish" status="PUBLISHED" label="Publish" variant="outline" />
                    )}
                    <ModerationAction type="job" id={job.id} action="close" status="CLOSED" label="Close" variant="ghost" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobs.length ? <p className="p-6 text-sm text-muted-foreground">No jobs on the platform.</p> : null}
      </div>
    </div>
  );
}
