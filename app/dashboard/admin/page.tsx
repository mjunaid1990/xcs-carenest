import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { parseJson } from "@/lib/json";
import { formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRole("ADMIN");

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [families, caregivers, agencies, pendingVerifications, openReports, pendingReviews, activeSubs, revenue, audits] =
    await Promise.all([
      prisma.user.count({ where: { role: "FAMILY", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "CAREGIVER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "AGENCY", status: "ACTIVE" } }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { gt: new Date() } } }),
      prisma.payment.aggregate({ where: { status: "SUCCEEDED", createdAt: { gte: since } }, _sum: { amountCents: true } }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
    ]);

  return (
    <div>
      <PageHeader title="Admin overview" description="Platform health, moderation queues and recent privileged actions." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Families" value={families} />
        <StatCard label="Caregivers" value={caregivers} />
        <StatCard label="Agencies" value={agencies} />
        <StatCard label="Active subscriptions" value={activeSubs} />
        <StatCard label="Pending verifications" value={pendingVerifications} />
        <StatCard label="Open reports" value={openReports} />
        <StatCard label="Reviews awaiting moderation" value={pendingReviews} />
        <StatCard label="Revenue this month" value={formatMoney(revenue._sum.amountCents ?? 0)} hint="Succeeded payments" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Moderation queues</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5">
              <span>Verification requests</span>
              <Link href="/dashboard/admin/verifications" className="font-semibold text-primary hover:underline">
                {pendingVerifications} pending →
              </Link>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5">
              <span>Safety reports</span>
              <Link href="/dashboard/admin/reports" className="font-semibold text-primary hover:underline">
                {openReports} open →
              </Link>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2.5">
              <span>Reviews</span>
              <Link href="/dashboard/admin/reviews" className="font-semibold text-primary hover:underline">
                {pendingReviews} pending →
              </Link>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Recent admin actions</h2>
          {audits.length ? (
            <ul className="divide-y divide-border/60">
              {audits.map((entry) => (
                <li key={entry.id} className="py-2.5 text-sm">
                  <p className="font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor.firstName} {entry.actor.lastName} · {entry.entityType} · {timeAgo(entry.createdAt)}
                    {parseJson<Record<string, unknown>>(entry.metadata, {}).status ? ` · ${String(parseJson<Record<string, unknown>>(entry.metadata, {}).status)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No privileged actions logged yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
