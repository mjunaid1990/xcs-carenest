import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook endpoint. Signature verification is mandatory when a signing
 * secret is configured; without Stripe keys the endpoint is inert.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !apiKey) {
    return Response.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ ok: false, error: "Missing signature." }, { status: 400 });

  const raw = await req.text();
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(apiKey);

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    console.error("[stripe] signature verification failed", error);
    return Response.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      if (!userId || !planId || !session.subscription) break;

      const stripeSub = await stripe.subscriptions.retrieve(String(session.subscription));
      const periodEnd = new Date(((stripeSub as unknown as { current_period_end?: number }).current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400) * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          status: stripeSub.status === "trialing" ? "TRIALING" : "ACTIVE",
          interval: (stripeSub.items.data[0]?.price.recurring?.interval === "year" ? "ANNUAL" : "MONTHLY"),
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          stripeCustomerId: String(session.customer ?? ""),
          stripeSubscriptionId: stripeSub.id,
        },
        include: { plan: { select: { name: true } } },
      });

      await notify({
        userId,
        type: "SUBSCRIPTION",
        title: "Subscription active",
        body: `Your ${subscription.plan.name} plan is active until ${periodEnd.toDateString()}.`,
        link: "/dashboard/subscription",
        email: true,
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const stripeSub = event.data.object as import("stripe").Stripe.Subscription;
      const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: stripeSub.id } });
      if (!existing) break;

      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status:
            stripeSub.status === "active" ? "ACTIVE"
              : stripeSub.status === "trialing" ? "TRIALING"
              : stripeSub.status === "past_due" ? "PAST_DUE"
              : stripeSub.status === "canceled" ? "CANCELED"
              : "EXPIRED",
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          currentPeriodEnd: new Date(((stripeSub as unknown as { current_period_end?: number }).current_period_end ?? existing.currentPeriodEnd.getTime() / 1000) * 1000),
          endedAt: stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000) : existing.endedAt,
        },
      });

      if (event.type === "customer.subscription.deleted") {
        await notify({
          userId: existing.userId,
          type: "SUBSCRIPTION",
          title: "Subscription ended",
          body: "Your paid plan has ended. You are now on the free plan.",
          link: "/pricing",
          email: true,
        });
      }
      break;
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as import("stripe").Stripe.Invoice;
      const stripeSubId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      const subscription = stripeSubId
        ? await prisma.subscription.findUnique({ where: { stripeSubscriptionId: stripeSubId } })
        : null;
      if (!subscription) break;

      const failed = event.type === "invoice.payment_failed";
      await prisma.payment.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          provider: "STRIPE",
          providerPaymentId: String(invoice.id ?? ""),
          status: failed ? "FAILED" : "SUCCEEDED",
          amountCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
          currency: invoice.currency ?? "usd",
          description: invoice.description ?? "Subscription payment",
          failureReason: failed ? (invoice as unknown as { last_payment_error?: { message?: string } }).last_payment_error?.message ?? "Payment failed" : null,
        },
      });

      await notify({
        userId: subscription.userId,
        type: failed ? "PAYMENT_FAILED" : "PAYMENT_SUCCESS",
        title: failed ? "Payment failed" : "Payment received",
        body: failed
          ? "We could not process your latest subscription payment. Update your payment method to keep your plan."
          : `We received your payment of ${((invoice.amount_paid ?? 0) / 100).toFixed(2)} ${(invoice.currency ?? "usd").toUpperCase()}.`,
        link: "/dashboard/subscription",
        email: true,
      });
      break;
    }

    default:
      break;
  }

  return Response.json({ ok: true, received: event.type });
}
