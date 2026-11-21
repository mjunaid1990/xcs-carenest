import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatMoney } from "@/lib/utils";
import { parseJson } from "@/lib/json";

export type PricingPlan = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  priceMonthlyCents: number;
  priceAnnualCents: number;
  currency: string;
  features: string;
  isPopular: boolean;
  audience: string;
};

export function PricingCard({
  plan,
  annual,
  href,
  ctaLabel,
  current,
}: {
  plan: PricingPlan;
  annual: boolean;
  href: string;
  ctaLabel: string;
  current?: boolean;
}) {
  const features = parseJson<string[]>(plan.features, []);
  const price = annual ? plan.priceAnnualCents : plan.priceMonthlyCents;
  const isFree = plan.priceMonthlyCents === 0 && plan.priceAnnualCents === 0;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-soft",
        plan.isPopular ? "border-primary ring-1 ring-primary/20" : "border-border/70"
      )}
    >
      {plan.isPopular ? (
        <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
          Most popular
        </Badge>
      ) : null}

      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="display text-4xl">{isFree ? "Free" : formatMoney(price, plan.currency.toUpperCase())}</span>
        {!isFree ? (
          <span className="text-sm text-muted-foreground">/{annual ? "year" : "month"}</span>
        ) : null}
      </div>
      {!isFree && annual ? (
        <p className="mt-1 text-xs text-primary">
          Save {Math.max(0, Math.round((1 - plan.priceAnnualCents / (plan.priceMonthlyCents * 12)) * 100))}% vs monthly
        </p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-ink-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <Button asChild className="mt-6 w-full" variant={plan.isPopular ? "default" : "outline"}>
        <Link href={href}>{current ? "Manage plan" : ctaLabel}</Link>
      </Button>
    </div>
  );
}
