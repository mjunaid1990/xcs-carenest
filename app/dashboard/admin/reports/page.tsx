import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModerationAction } from "@/components/dashboard/moderation-action";
import { Badge } from "@/components/ui/badge";
import { REPORT_REASONS } from "@/lib/presentation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireRole("ADMIN");
  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
    include: { reporter: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div>
      <PageHeader title="Safety reports" description="Every report is triaged here. Resolutions notify the reporter and are written to the audit log." />
      {!reports.length ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No reports have been filed.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{REPORT_REASONS[report.reason] ?? report.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.targetType.toLowerCase()} · reported by {report.reporter.firstName} {report.reporter.lastName} ({report.reporter.email}) ·{" "}
                    {formatDate(report.createdAt)}
                  </p>
                  <p className="mt-2 rounded-xl bg-sand-50 p-3 text-[13px] leading-6 text-ink-700">{report.details}</p>
                  {report.targetUserId ? <p className="mt-1 text-[11px] text-muted-foreground">Target user: {report.targetUserId}</p> : null}
                  {report.targetJobId ? <p className="text-[11px] text-muted-foreground">Target job: {report.targetJobId}</p> : null}
                  {report.targetReviewId ? <p className="text-[11px] text-muted-foreground">Target review: {report.targetReviewId}</p> : null}
                </div>
                <Badge variant={report.status === "RESOLVED" ? "success" : report.status === "DISMISSED" ? "muted" : "warning"}>
                  {report.status.replace("_", " ").toLowerCase()}
                </Badge>
              </div>
              {["OPEN", "UNDER_REVIEW"].includes(report.status) ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <ModerationAction type="report" id={report.id} action="review" label="Mark under review" variant="outline" />
                  <ModerationAction type="report" id={report.id} action="resolve" label="Resolve" />
                  <ModerationAction type="report" id={report.id} action="dismiss" label="Dismiss" variant="ghost" />
                </div>
              ) : report.resolutionNote ? (
                <p className="mt-2 text-xs text-muted-foreground">Resolution: {report.resolutionNote}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
