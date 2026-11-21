"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/forms/field";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; singular: string };

export function SearchFilters({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const value = (key: string) => params.get(key) ?? "";

  function apply(formData: FormData) {
    const next = new URLSearchParams();
    const keys = [
      "type",
      "q",
      "city",
      "zip",
      "radius",
      "minRate",
      "maxRate",
      "experience",
      "availability",
      "living",
      "verified",
      "languages",
      "certifications",
      "minRating",
      "sort",
      "view",
    ];
    for (const key of keys) {
      const entry = String(formData.get(key) ?? "").trim();
      if (entry) next.set(key, entry);
    }
    router.push(`/search?${next.toString()}`);
    setOpen(false);
  }

  const activeCount = [
    "type",
    "city",
    "zip",
    "minRate",
    "maxRate",
    "experience",
    "availability",
    "living",
    "verified",
    "languages",
    "certifications",
    "minRating",
  ].filter((key) => params.get(key)).length;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount ? (
            <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
        <span className="text-xs text-muted-foreground">{total} results</span>
      </div>

      <form
        action={apply}
        className={cn(
          "space-y-5 rounded-2xl border border-border/70 bg-white p-5 shadow-soft",
          "lg:block",
          open
            ? "fixed inset-0 z-50 overflow-y-auto rounded-none p-5 lg:static lg:z-auto lg:rounded-2xl"
            : "hidden"
        )}
      >
        <div className="flex items-center justify-between lg:hidden">
          <p className="text-base font-semibold">Filters</p>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Care type
          </p>
          <NativeSelect name="type" defaultValue={value("type")} aria-label="Care type">
            <option value="">Any care type</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location
          </p>
          <Input name="city" defaultValue={value("city")} placeholder="City" aria-label="City" />
          <div className="grid grid-cols-2 gap-2">
            <Input name="zip" defaultValue={value("zip")} placeholder="ZIP code" aria-label="ZIP code" />
            <NativeSelect name="radius" defaultValue={value("radius")} aria-label="Search radius">
              <option value="">Any radius</option>
              <option value="5">Within 5 mi</option>
              <option value="10">Within 10 mi</option>
              <option value="25">Within 25 mi</option>
              <option value="50">Within 50 mi</option>
              <option value="100">Within 100 mi</option>
            </NativeSelect>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rate per hour
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min ($)" htmlFor="minRate">
              <Input id="minRate" name="minRate" type="number" min={0} defaultValue={value("minRate")} placeholder="0" />
            </Field>
            <Field label="Max ($)" htmlFor="maxRate">
              <Input id="maxRate" name="maxRate" type="number" min={0} defaultValue={value("maxRate")} placeholder="50" />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Experience & availability
          </p>
          <Field label="Minimum years of experience" htmlFor="experience">
            <Input id="experience" name="experience" type="number" min={0} max={40} defaultValue={value("experience")} placeholder="Any" />
          </Field>
          <Field label="Employment type" htmlFor="availability">
            <NativeSelect id="availability" name="availability" defaultValue={value("availability")}>
              <option value="">Any</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
            </NativeSelect>
          </Field>
          <Field label="Living arrangement" htmlFor="living">
            <NativeSelect id="living" name="living" defaultValue={value("living")}>
              <option value="">Any</option>
              <option value="live_in">Live-in</option>
              <option value="live_out">Live-out</option>
            </NativeSelect>
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Trust & skills
          </p>
          <Field label="Verification" htmlFor="verified">
            <NativeSelect id="verified" name="verified" defaultValue={value("verified")}>
              <option value="">Any verification</option>
              <option value="identity">Identity verified</option>
              <option value="background">Background checked</option>
            </NativeSelect>
          </Field>
          <Field label="Languages" htmlFor="languages" hint="Comma separated, e.g. Spanish">
            <Input id="languages" name="languages" defaultValue={value("languages")} placeholder="English, Spanish" />
          </Field>
          <Field label="Certification" htmlFor="certifications">
            <Input id="certifications" name="certifications" defaultValue={value("certifications")} placeholder="CPR, Nursing…" />
          </Field>
          <Field label="Minimum rating" htmlFor="minRating">
            <NativeSelect id="minRating" name="minRating" defaultValue={value("minRating")}>
              <option value="">Any rating</option>
              <option value="3">3 stars & up</option>
              <option value="4">4 stars & up</option>
              <option value="4.5">4.5 stars & up</option>
            </NativeSelect>
          </Field>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            Show results
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/search")}>
            Reset
          </Button>
        </div>
      </form>
    </>
  );
}

export function ResultsToolbar({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-ink-900">{total}</span> caregiver
        {total === 1 ? "" : "s"} found
      </p>
      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-xs text-muted-foreground">
          Sort
        </Label>
        <NativeSelect
          id="sort"
          className="h-9 w-44 text-sm"
          value={params.get("sort") ?? "relevance"}
          onChange={(event) => update("sort", event.target.value)}
        >
          <option value="relevance">Recommended</option>
          <option value="rating">Highest rated</option>
          <option value="rate_low">Lowest rate</option>
          <option value="rate_high">Highest rate</option>
          <option value="experience">Most experienced</option>
          <option value="newest">Newest profiles</option>
        </NativeSelect>
        <div className="hidden overflow-hidden rounded-lg border border-border sm:flex">
          {(["grid", "list", "map"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update("view", mode)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                (params.get("view") ?? "grid") === mode
                  ? "bg-primary text-white"
                  : "bg-white text-ink-500 hover:bg-muted"
              )}
              aria-pressed={(params.get("view") ?? "grid") === mode}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
