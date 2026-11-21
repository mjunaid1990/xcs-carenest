import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { searchJobs } from "@/lib/search";
import { JobCard } from "@/components/marketing/job-card";
import { Breadcrumbs, Section } from "@/components/marketing/section";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Care Jobs",
  description:
    "Browse open nanny, babysitting, senior care, pet care and housekeeping jobs. Filter by care type, location and budget.",
  path: "/care-jobs",
});

export default async function CareJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const get = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Math.max(1, Number(get("page") ?? 1) || 1);
  const type = get("type") ?? "";
  const city = get("city") ?? "";
  const q = get("q") ?? "";
  const employmentType = get("employmentType") ?? "";
  const living = get("living") ?? "";
  const sort = (get("sort") ?? "newest") as "newest" | "budget_high" | "budget_low";

  const [categories, results] = await Promise.all([
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    searchJobs({
      type: type || undefined,
      city: city || undefined,
      q: q || undefined,
      employmentType: employmentType || undefined,
      living: living || undefined,
      sort,
      page,
    }),
  ]);

  return (
    <>
      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-10">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/care-jobs", label: "Care jobs" }]} />
          <h1 className="display text-3xl sm:text-4xl">Care jobs</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-500">
            {results.total} open role{results.total === 1 ? "" : "s"} from families and agencies.
            Browse, save the ones that fit and apply with a personal message.
          </p>

          <form className="mt-6 grid gap-2 rounded-2xl border border-border/80 bg-white p-3 shadow-soft md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Job title or keyword"
                className="pl-9"
                aria-label="Search jobs"
              />
            </div>
            <Input name="city" defaultValue={city} placeholder="City" aria-label="City" />
            <NativeSelect name="type" defaultValue={type} aria-label="Care type">
              <option value="">All care types</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="employmentType" defaultValue={employmentType} aria-label="Employment type">
              <option value="">Any schedule</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="OCCASIONAL">Occasional</option>
            </NativeSelect>
            <Button type="submit">Search jobs</Button>
            <input type="hidden" name="living" value={living} />
            <input type="hidden" name="sort" value={sort} />
          </form>
        </div>
      </div>

      <Section className="py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-ink-900">{results.items.length}</span> of{" "}
            {results.total}
          </p>
          <div className="flex gap-2">
            {[
              { value: "newest", label: "Newest" },
              { value: "budget_high", label: "Highest budget" },
              { value: "budget_low", label: "Lowest budget" },
            ].map((option) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (city) params.set("city", city);
              if (type) params.set("type", type);
              if (employmentType) params.set("employmentType", employmentType);
              params.set("sort", option.value);
              return (
                <Link
                  key={option.value}
                  href={`/care-jobs?${params.toString()}`}
                  className={
                    sort === option.value
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        {results.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.items.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="No jobs match those filters"
            description="Try a different care type or city, or clear the filters to see every open role."
            action={{ href: "/care-jobs", label: "Clear filters" }}
          />
        )}

        <Pagination page={results.page} pageCount={results.pageCount} className="mt-8" />
      </Section>
    </>
  );
}
