"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; singular: string };

export function SearchBar({
  categories,
  defaultType,
  defaultCity,
  variant = "hero",
}: {
  categories: Category[];
  defaultType?: string;
  defaultCity?: string;
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const [type, setType] = useState(defaultType ?? categories[0]?.slug ?? "nanny");
  const [location, setLocation] = useState(defaultCity ?? "");
  const [when, setWhen] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (location.trim()) params.set("location", location.trim());
    if (when) params.set("when", when);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "w-full rounded-2xl border border-border/80 bg-white p-3 shadow-lift",
        variant === "hero" ? "sm:p-4" : ""
      )}
      role="search"
      aria-label="Search for caregivers"
    >
      <div className="grid gap-2 sm:grid-cols-[1.1fr_1.4fr_1fr_auto]">
        <label className="group relative flex flex-col justify-center rounded-xl px-3 py-2 hover:bg-muted/60">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Type of care
          </span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-ink-900 focus:outline-none"
            aria-label="Type of care"
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.singular}
              </option>
            ))}
          </select>
        </label>

        <div className="relative flex flex-col justify-center rounded-xl border-t border-border px-3 py-2 sm:border-l sm:border-t-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Location or ZIP
          </span>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City or ZIP code"
              className="w-full bg-transparent text-sm font-medium text-ink-900 placeholder:font-normal placeholder:text-muted-foreground focus:outline-none"
              aria-label="Location or ZIP code"
            />
          </div>
        </div>

        <div className="relative flex flex-col justify-center rounded-xl border-t border-border px-3 py-2 sm:border-l sm:border-t-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            When
          </span>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            <input
              type="date"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
              className="w-full bg-transparent text-sm font-medium text-ink-900 focus:outline-none"
              aria-label="When do you need care"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="h-full min-h-12 w-full sm:w-auto">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>
    </form>
  );
}
