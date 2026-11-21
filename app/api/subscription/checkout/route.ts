import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { notify } from "@/lib/notifications";

/**
 * Starts a subscription checkout.
 *
 * With Stripe configured this creates a Checkout Session using the price IDs
 * stored on the plan. Without keys the platform runs in a clearly-labelled
 * sandbox: the subscription is recorded locally and no card is charged.
 */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { planSlug, interval } = await readJson<{ planSlug?: string; interval?: string }>(req);
  if (!planSlug) throw ApiError.badRequest("Choose a plan.");

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { slug: planSlug, isActive: true },
  });
  if (!plan) throw ApiError.notFound("Plan not found.");
  if (plan.priceMonthlyCents === 0 && plan.priceAnnualCents === 0) {
    throw ApiError.badRequest("The free plan does not require checkout.");
  }

  const billing = interval === "annual" ? "ANNUAL" : "MONTHLY";
  const priceId = billing === "ANNUAL" ? plan.stripePriceAnnualId : plan.stripePriceMonthlyId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (process.env.STRIPE_SECRET_KEY && priceId) {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/subscription?status=success`,
      cancel_url: `${appUrl}/pricing?status=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, planId: plan.id, interval: billing },
      subscription_data: { metadata: { userId: user.id, planId: plan.id } },
    });
    return jsonOk({ url: session.url, mode: "stripe" });
  }

  // Sandbox mode — no Stripe keys or the plan has no Stripe price configured.
  const periodEnd = new Date();
  if (billing === "ANNUAL") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);
  const amount = billing === "ANNUAL" ? plan.priceAnnualCents : plan.priceMonthlyCents;

  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { userId: user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    const subscription = await tx.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        interval: billing,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });
    await tx.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        provider: "SANDBOX",
        status: "SUCCEEDED",
        amountCents: amount,
        currency: plan.currency,
        description: `${plan.name} (${billing.toLowerCase()}) — sandbox`,
      },
    });
    await tx.invoice.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        number: `CN-SANDBOX-${Date.now()}`,
        status: "PAID",
        amountCents: amount,
        currency: plan.currency,
        paidAt: new Date(),
        lineItems: JSON.stringify([
          { description: `${plan.name} (${billing.toLowerCase()})`, amountCents: amount, quantity: 1 },
        ]),
      },
    });
  });

  await notify({
    userId: user.id,
    type: "SUBSCRIPTION",
    title: "Subscription activated (sandbox)",
    body: `Your ${plan.name} plan is active until ${periodEnd.toDateString()}. No payment was taken in sandbox mode.`,
    link: "/dashboard/subscription",
    email: true,
  });

  return jsonOk({ url: "/dashboard/subscription?status=sandbox", mode: "sandbox" });
});
