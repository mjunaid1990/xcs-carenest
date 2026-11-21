import { handler, jsonOk, assertSameOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { notify } from "@/lib/notifications";

/** Cancel at period end — access continues until the paid period expires. */
export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true } } },
  });
  if (!subscription) throw ApiError.notFound("You do not have an active subscription.");

  if (subscription.stripeSubscriptionId) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw ApiError.badRequest("Stripe is not configured on this environment.");
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: true });
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  await notify({
    userId: user.id,
    type: "SUBSCRIPTION",
    title: "Subscription cancellation scheduled",
    body: `Your ${subscription.plan.name} plan stays active until ${subscription.currentPeriodEnd.toDateString()}.`,
    link: "/dashboard/subscription",
    email: true,
  });

  return jsonOk({ cancelAtPeriodEnd: true, currentPeriodEnd: subscription.currentPeriodEnd });
});
