import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlanEditor } from "./plan-editor";
import { Badge } from "@/components/ui/badge";
import { parseJson } from "@/lib/json";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireRole("ADMIN");
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ audience: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Subscription plans"
        description="Prices, limits and features are stored in the database and shown on the public pricing page. No prices are hardcoded."
      />
      <div className="space-y-3">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{plan.name}</h2>
                  <Badge variant="secondary">{plan.audience.toLowerCase()}</Badge>
                  {plan.isPopular ? <Badge>Popular</Badge> : null}
                  {!plan.isActive ? <Badge variant="muted">Inactive</Badge> : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatMoney(plan.priceMonthlyCents)}/mo · {formatMoney(plan.priceAnnualCents)}/yr ·{" "}
                  {plan._count.subscriptions} subscriber{plan._count.subscriptions === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Limits: searches {plan.searchLimit ?? "∞"} · applications {plan.applicationLimit ?? "∞"} · contacts {plan.contactLimit ?? "∞"} · jobs {plan.jobPostLimit ?? "∞"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{parseJson<string[]>(plan.features, []).length} features</p>
              </div>
              <PlanEditor
                plan={{
                  id: plan.id, slug: plan.slug, name: plan.name, audience: plan.audience,
                  tagline: plan.tagline, priceMonthlyCents: plan.priceMonthlyCents,
                  priceAnnualCents: plan.priceAnnualCents,
                  features: parseJson<string[]>(plan.features, []),
                  searchLimit: plan.searchLimit, applicationLimit: plan.applicationLimit,
                  contactLimit: plan.contactLimit, jobPostLimit: plan.jobPostLimit,
                  trialDays: plan.trialDays, isActive: plan.isActive,
                  isPopular: plan.isPopular, sortOrder: plan.sortOrder,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
