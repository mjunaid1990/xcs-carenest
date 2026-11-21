import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { InterviewActions } from "@/components/dashboard/interview-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { INTERVIEW_STATUS_LABELS } from "@/lib/presentation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const user = await requireUser();
  const isCaregiver = user.role === "CAREGIVER";
  const interviews = await prisma.interview.findMany({
    where: isCaregiver ? { caregiverId: user.id } : { familyId: user.id },
    orderBy: { scheduledAt: "desc" },
    take: 50,
    include: {
      job: { select: { title: true, slug: true } },
      family: { select: { firstName: true, lastName: true } },
      caregiver: { select: { firstName: true, lastName: true } },
    },
  });

  const upcoming = interviews.filter((row) => row.scheduledAt >= new Date() && !["CANCELLED", "DECLINED", "COMPLETED"].includes(row.status));
  const past = interviews.filter((row) => !upcoming.includes(row));

  return (
    <div>
      <PageHeader title="Interviews" description="Accept, reschedule or complete interviews. Both sides get notified of every change." />
      {!interviews.length ? (
        <EmptyState
          title="No interviews yet"
          description={isCaregiver ? "When a family invites you, the interview appears here." : "Shortlist an applicant and send an interview invitation."}
        />
      ) : (
        <div className="space-y-8">
          {[{ title: "Upcoming", rows: upcoming }, { title: "Past and closed", rows: past }].map((group) =>
            group.rows.length ? (
              <section key={group.title}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</h2>
                <div className="space-y-3">
                  {group.rows.map((row) => {
                    const other = isCaregiver
                      ? `${row.family.firstName} ${row.family.lastName}`
                      : `${row.caregiver.firstName} ${row.caregiver.lastName}`;
                    return (
                      <article key={row.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold">
                              {row.job ? <Link href={`/care-jobs/${row.job.slug}`} className="hover:text-primary">{row.job.title}</Link> : "Interview"}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              With {other} · {formatDate(row.scheduledAt, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}{" "}
                              at {formatDate(row.scheduledAt, { hour: "numeric", minute: "2-digit" })} · {row.durationMinutes} min ·{" "}
                              {row.type === "ONLINE" ? "Video call" : row.type === "PHONE" ? "Phone" : "In person"}
                            </p>
                          </div>
                          <Badge variant={row.status === "ACCEPTED" ? "success" : row.status === "PROPOSED" ? "secondary" : "muted"}>
                            {INTERVIEW_STATUS_LABELS[row.status] ?? row.status}
                          </Badge>
                        </div>
                        {row.meetingLink ? (
                          <a href={row.meetingLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                            Join meeting link
                          </a>
                        ) : null}
                        {row.notes ? <p className="mt-2 rounded-xl bg-sand-50 p-3 text-xs leading-5 text-ink-500">{row.notes}</p> : null}
                        <div className="mt-3 border-t border-border pt-3">
                          <InterviewActions interviewId={row.id} role={user.role} status={row.status} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
