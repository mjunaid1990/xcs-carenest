import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModerationAction } from "@/components/dashboard/moderation-action";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireRole("ADMIN");
  const reviews = await prisma.review.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      author: { select: { firstName: true, lastName: true, email: true } },
      caregiver: { include: { user: { select: { firstName: true, lastName: true } } } },
      job: { select: { title: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Reviews" description="Publish, hide or remove reviews. Only verified hires can write reviews, and ratings recalculate automatically." />
      {!reviews.length ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {review.caregiver
                      ? `${review.caregiver.user.firstName} ${review.caregiver.user.lastName}`
                      : "Caregiver"}{" "}
                    <span className="font-normal text-amber-600">{review.rating}/5</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By {review.author.firstName} {review.author.lastName} · {formatDate(review.createdAt)}
                    {review.job ? ` · ${review.job.title}` : ""}
                    {review.isVerified ? " · verified hire" : ""}
                  </p>
                  {review.title ? <p className="mt-2 text-sm font-medium">{review.title}</p> : null}
                  <p className="mt-1 text-[13px] leading-6 text-ink-500">{review.body}</p>
                  {review.responseBody ? <p className="mt-2 rounded-xl bg-sand-50 p-3 text-xs text-ink-500">Response: {review.responseBody}</p> : null}
                </div>
                <Badge variant={review.status === "PUBLISHED" ? "success" : review.status === "REMOVED" ? "destructive" : "muted"}>
                  {review.status.toLowerCase()}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {review.status !== "PUBLISHED" ? (
                  <ModerationAction type="review" id={review.id} action="publish" label="Publish" />
                ) : null}
                {review.status !== "HIDDEN" ? (
                  <ModerationAction type="review" id={review.id} action="hide" label="Hide" variant="ghost" />
                ) : null}
                {review.status !== "REMOVED" ? (
                  <ModerationAction type="review" id={review.id} action="remove" label="Remove" variant="ghost"
                    confirmText="Remove this review from public view?" />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
