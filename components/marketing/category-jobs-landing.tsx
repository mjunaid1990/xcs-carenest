import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { searchJobs } from "@/lib/search";
import { JobCard } from "@/components/marketing/job-card";
import { Breadcrumbs, Section } from "@/components/marketing/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export async function CategoryJobsLanding({
  categorySlug,
  title,
  description,
  path,
}: {
  categorySlug: string;
  title: string;
  description: string;
  path: string;
}) {
  const [category, jobs, faqs, cities] = await Promise.all([
    prisma.careCategory.findUnique({ where: { slug: categorySlug } }),
    searchJobs({ type: categorySlug, sort: "newest" }),
    prisma.faq.findMany({
      where: { isActive: true, category: { in: ["reviews", "trust"] } },
      orderBy: { sortOrder: "asc" },
      take: 4,
      select: { id: true, question: true, answer: true },
    }),
    prisma.careJob.groupBy({
      by: ["city", "state"],
      where: { status: "PUBLISHED", category: { slug: categorySlug } },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
  ]);

  if (!category) notFound();

  return (
    <>
      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-10">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/care-jobs", label: "Care jobs" },
              { href: path, label: title },
            ]}
          />
          <h1 className="display text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-500">{description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/register?role=caregiver">Create a caregiver profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/caregiver/jobs">Browse in your dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <Section className="py-10">
        <h2 className="text-lg font-semibold">
          {jobs.total} open {category.name.toLowerCase()} role{jobs.total === 1 ? "" : "s"}
        </h2>
        {jobs.items.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.items.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No open roles yet"
              description="New roles appear here as soon as a family publishes them. Create a profile so families can find you directly."
              action={{ href: "/register?role=caregiver", label: "Create a profile" }}
            />
          </div>
        )}
        {jobs.pageCount > 1 ? (
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href={`/care-jobs?type=${categorySlug}`}>See all {category.name.toLowerCase()} jobs</Link>
            </Button>
          </div>
        ) : null}
      </Section>

      {cities.length ? (
        <Section muted className="py-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title} by city
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((row) => (
              <Link
                key={`${row.city}-${row.state}`}
                href={`/care-jobs?type=${categorySlug}&city=${encodeURIComponent(row.city)}`}
                className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm hover:border-primary/40 hover:text-primary"
              >
                {row.city}, {row.state}
                <span className="ml-1.5 text-xs text-muted-foreground">{row._count.city}</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section className="py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <h2 className="display text-2xl">Applying: common questions</h2>
            <FaqAccordion faqs={faqs} />
          </div>
        </Section>
      ) : null}
    </>
  );
}
