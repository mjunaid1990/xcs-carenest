import Link from "next/link";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveSubscription, getPlanForUser } from "@/lib/subscription";
import { getSessionUser } from "@/lib/auth";
import { PricingTabs } from "@/components/marketing/pricing-tabs";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/empty-state";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "Compare CareNest plans for families, caregivers and agencies. Start free, upgrade when you need more contacts, applications or job posts.",
  path: "/pricing",
});

export const revalidate = 300;

export default async function PricingPage() {
  const user = await getSessionUser();
  const [plans, faqs, active] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ audience: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true, slug: true, name: true, tagline: true, audience: true,
        priceMonthlyCents: true, priceAnnualCents: true, currency: true,
        features: true, isPopular: true,
      },
    }),
    prisma.faq.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 8,
      select: { id: true, question: true, answer: true },
    }),
    user ? getActiveSubscription(user.id) : Promise.resolve(null),
  ]);

  const currentPlan = user ? await getPlanForUser(user.id, user.role) : null;
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <>
      <section className="border-b border-border/60 bg-gradient-to-b from-sand-50 to-background">
        <div className="container-page py-14 text-center sm:py-20">
          <p className="eyebrow">Pricing</p>
          <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl">
            Start free. Upgrade when it pays off.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
            Every plan is configured by our team in the admin panel, so prices and limits are always
            current. Cancel at any time — annual plans are billed once per year.
          </p>
          {currentPlan ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1.5 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Your current plan: {currentPlan.planName}
              {active?.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
            </p>
          ) : null}
        </div>
      </section>

      <Section>
        {!stripeReady ? (
          <div className="mx-auto mb-8 max-w-3xl">
            <Alert variant="warning" title="Sandbox billing mode">
              Stripe keys are not configured, so checkout runs in a clearly-labelled sandbox: the
              subscription is activated locally for testing and no card is charged. Add
              <code className="mx-1 rounded bg-white/70 px-1">STRIPE_SECRET_KEY</code> and price IDs to
              enable real billing.
            </Alert>
          </div>
        ) : null}
        <PricingTabs
          plans={plans}
          signedIn={Boolean(user)}
          currentPlanSlug={currentPlan?.planSlug ?? null}
        />
      </Section>

      <Section muted>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-2">Billing questions</p>
            <h2 className="display text-3xl">What the plans include</h2>
            <ul className="mt-5 space-y-3 text-sm text-ink-500">
              {["Limits apply per billing period and reset automatically.",
                "Upgrades take effect immediately; downgrades apply at the next renewal.",
                "Unused contacts and applications do not roll over.",
                "Invoices and receipts are available from your dashboard."].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/contact?topic=billing"><HelpCircle className="h-4 w-4" /> Ask about billing</Link>
            </Button>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </Section>
    </>
  );
}
