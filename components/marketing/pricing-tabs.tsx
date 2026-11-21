"use client";

import { useState } from "react";
import { PricingCard, type PricingPlan } from "@/components/marketing/pricing-card";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  { value: "FAMILY", label: "For families" },
  { value: "CAREGIVER", label: "For caregivers" },
  { value: "AGENCY", label: "For agencies" },
] as const;

export function PricingTabs({
  plans,
  currentPlanSlug,
  signedIn,
}: {
  plans: PricingPlan[];
  currentPlanSlug?: string | null;
  signedIn: boolean;
}) {
  const [audience, setAudience] = useState<string>("FAMILY");
  const [annual, setAnnual] = useState(false);

  const filtered = plans.filter((plan) => plan.audience === audience);

  return (
    <div>
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex rounded-xl border border-border bg-white p-1 shadow-soft" role="tablist">
          {AUDIENCES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={audience === item.value}
              onClick={() => setAudience(item.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                audience === item.value ? "bg-primary text-white" : "text-ink-700 hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className={cn(!annual && "font-semibold")}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Bill annually"
            onClick={() => setAnnual((value) => !value)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              annual ? "bg-primary" : "bg-sand-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                annual ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
          <span className={cn(annual && "font-semibold")}>
            Annual <span className="text-xs text-primary">(save up to 20%)</span>
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            annual={annual}
            current={Boolean(signedIn && currentPlanSlug === plan.slug)}
            href={
              signedIn
                ? `/dashboard/subscription?plan=${plan.slug}&interval=${annual ? "annual" : "monthly"}`
                : `/register?role=${plan.audience.toLowerCase()}&plan=${plan.slug}`
            }
            ctaLabel={plan.priceMonthlyCents === 0 ? "Start free" : "Choose plan"}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans are currently available for this audience.</p>
        ) : null}
      </div>
    </div>
  );
}
