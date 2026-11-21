import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModerationAction } from "@/components/dashboard/moderation-action";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  await requireRole("ADMIN");
  const requests = await prisma.verificationRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, role: true } },
      document: { select: { id: true, fileName: true } },
    },
  });

  const pending = requests.filter((request) => ["PENDING", "INFO_REQUESTED"].includes(request.status));
  const decided = requests.filter((request) => !["PENDING", "INFO_REQUESTED"].includes(request.status));

  function Card({ request }: { request: (typeof requests)[number] }) {
    return (
      <article className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {request.user.firstName} {request.user.lastName}{" "}
              <span className="text-xs font-normal text-muted-foreground">({request.user.role.toLowerCase()})</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {request.type.replace(/_/g, " ").toLowerCase()} · submitted {formatDate(request.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">{request.user.email}</p>
            {request.document ? (
              <a href={`/api/files/${request.document.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-primary hover:underline">
                View {request.document.fileName}
              </a>
            ) : (
              <p className="mt-1 text-xs text-amber-700">No document attached</p>
            )}
            {request.reviewNote ? <p className="mt-1 text-xs text-ink-500">Note: {request.reviewNote}</p> : null}
          </div>
          <Badge variant={request.status === "APPROVED" ? "success" : request.status === "REJECTED" ? "destructive" : "warning"}>
            {request.status.replace("_", " ").toLowerCase()}
          </Badge>
        </div>
        {["PENDING", "INFO_REQUESTED"].includes(request.status) ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <ModerationAction type="verification" id={request.id} action="approve" label="Approve" />
            <ModerationAction type="verification" id={request.id} action="info" label="Request info" variant="ghost" />
            <ModerationAction type="verification" id={request.id} action="reject" label="Reject" variant="ghost" confirmText="Reject this verification request?" />
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div>
      <PageHeader title="Verification queue" description="Approve or reject identity, background, qualification, reference and licence checks. Decisions notify the member." />
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pending ({pending.length})</h2>
        {pending.length ? <div className="space-y-3">{pending.map((request) => <Card key={request.id} request={request} />)}</div> : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">The queue is clear.</p>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recently decided</h2>
        {decided.length ? <div className="space-y-3">{decided.slice(0, 20).map((request) => <Card key={request.id} request={request} />)}</div> : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No decisions yet.</p>
        )}
      </section>
    </div>
  );
}
