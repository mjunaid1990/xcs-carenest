import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audienceForRole, getActiveSubscription, getUsage } from "@/lib/subscription";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { CancelPlan, PlanAction } from "@/components/dashboard/plan-action";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/empty-state";
import { parseJson } from "@/lib/json";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/presentation";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await requireUser();
  const audience = audienceForRole(user.role);
  const [plans, active, usage, payments, invoices] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { audience, isActive: true }, orderBy: { sortOrder: "asc" } }),
    getActiveSubscription(user.id),
    getUsage(user.id, user.role),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.invoice.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <div>
      <PageHeader title="Subscription" description="Your plan, usage and billing history. Prices come from the admin-configured plan catalogue." />

      {active ? (
        <div className="mb-6 rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{active.plan.name}</h2>
                <Badge variant="success">{SUBSCRIPTION_STATUS_LABELS[active.status] ?? active.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {active.interval === "ANNUAL" ? "Billed annually" : "Billed monthly"} · Renews {formatDate(active.currentPeriodEnd)}
                {active.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
              </p>
            </div>
            {!active.cancelAtPeriodEnd ? <CancelPlan /> : null}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <Alert variant="info" title="You are on the free plan">
            Upgrade for more contacts, applications or job posts. Everything else stays the same.
          </Alert>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Applications this period" value={usage.applications} hint={usage.plan.applicationLimit == null ? "Unlimited" : `Limit ${usage.plan.applicationLimit}`} />
        <StatCard label="Job posts this period" value={usage.jobPosts} hint={usage.plan.jobPostLimit == null ? "Unlimited" : `Limit ${usage.plan.jobPostLimit}`} />
        <StatCard label="Conversations this period" value={usage.contacts} hint={usage.plan.contactLimit == null ? "Unlimited" : `Limit ${usage.plan.contactLimit}`} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Plans for you</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const features = parseJson<string[]>(plan.features, []);
            const current = active?.plan.id === plan.id;
            const free = plan.priceMonthlyCents === 0 && plan.priceAnnualCents === 0;
            return (
              <div key={plan.id} className={`flex flex-col rounded-2xl border bg-white p-5 shadow-soft ${current ? "border-primary" : "border-border/70"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  {plan.isPopular ? <Badge>Popular</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                <p className="mt-3 text-2xl font-semibold">
                  {free ? "Free" : formatMoney(plan.priceMonthlyCents, plan.currency.toUpperCase())}
                  {!free ? <span className="text-xs font-normal text-muted-foreground">/mo</span> : null}
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-[13px] text-ink-500">
                  {features.slice(0, 6).map((feature) => <li key={feature}>· {feature}</li>)}
                </ul>
                <div className="mt-4">
                  {free ? (
                    <p className="text-xs text-muted-foreground">Included by default</p>
                  ) : current ? (
                    <p className="text-xs font-semibold text-primary">Current plan</p>
                  ) : (
                    <PlanAction planSlug={plan.slug} annual={false} label={`Choose ${plan.name}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Payments</h2>
          {payments.length ? (
            <ul className="divide-y divide-border/60 text-sm">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium">{formatMoney(payment.amountCents, payment.currency.toUpperCase())}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)} · {payment.provider.toLowerCase()}</p>
                  </div>
                  <Badge variant={payment.status === "SUCCEEDED" ? "success" : payment.status === "FAILED" ? "destructive" : "muted"}>
                    {payment.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Invoices</h2>
          {invoices.length ? (
            <ul className="divide-y divide-border/60 text-sm">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(invoice.issuedAt)} · {formatMoney(invoice.amountCents, invoice.currency.toUpperCase())}</p>
                  </div>
                  <Badge variant={invoice.status === "PAID" ? "success" : "muted"}>{invoice.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
