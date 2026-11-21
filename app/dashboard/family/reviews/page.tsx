import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewForm } from "./review-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FamilyReviewsPage() {
  const user = await requireRole("FAMILY");
  const [hires, written] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { job: { ownerId: user.id }, status: "HIRED" },
      orderBy: { hiredAt: "desc" },
      include: {
        job: { select: { title: true } },
        caregiver: { include: { user: { select: { firstName: true, lastName: true } } } },
        reviews: { where: { authorId: user.id } },
      },
    }),
    prisma.review.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      include: { caregiver: { include: { user: { select: { firstName: true, lastName: true } } } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Verified reviews only: you can review a caregiver after a confirmed hire, once per hire."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold">Waiting for your review</h2>
        {hires.filter((hire) => hire.reviews.length === 0).length ? (
          <ul className="space-y-3">
            {hires.filter((hire) => hire.reviews.length === 0).map((hire) => (
              <li key={hire.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {hire.caregiver.user.firstName} {hire.caregiver.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hire.job.title} · Hired {formatDate(hire.hiredAt)}
                    </p>
                  </div>
                  <ReviewForm
                    applicationId={hire.id}
                    caregiverName={`${hire.caregiver.user.firstName} ${hire.caregiver.user.lastName}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Nothing to review right now. Reviews unlock when you mark an applicant as hired.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Reviews you wrote</h2>
        {written.length ? (
          <ul className="space-y-3">
            {written.map((review) => (
              <li key={review.id} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {review.caregiver ? (
                      <Link href={`/caregivers/${review.caregiver.slug}`} className="hover:text-primary">
                        {review.caregiver.user.firstName} {review.caregiver.user.lastName}
                      </Link>
                    ) : "Caregiver"}
                  </p>
                  <span className="text-xs font-semibold text-amber-600">{review.rating}/5</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)} · {review.status.toLowerCase()}</p>
                {review.title ? <p className="mt-2 text-sm font-medium">{review.title}</p> : null}
                <p className="mt-1 text-sm leading-6 text-ink-500">{review.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews written yet" description="Your published reviews will appear here." />
        )}
      </section>
    </div>
  );
}
