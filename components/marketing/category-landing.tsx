import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { searchCaregivers } from "@/lib/search";
import { searchJobs } from "@/lib/search";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { JobCard } from "@/components/marketing/job-card";
import { SearchBar } from "@/components/marketing/search-bar";
import { Section, SectionHeading, Breadcrumbs } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

/**
 * Category landing page. Content comes from the CareCategory row so admins can
 * edit copy, and results come from the same database search used everywhere
 * else — no hardcoded lists.
 */
export async function CategoryLanding({ slug }: { slug: string }) {
  const category = await prisma.careCategory.findUnique({ where: { slug } });
  if (!category || !category.isActive) notFound();

  const [categories, caregivers, jobs, faqs, cityCounts] = await Promise.all([
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, singular: true },
    }),
    searchCaregivers({ type: slug, sort: "rating" }),
    searchJobs({ type: slug, sort: "newest" }),
    prisma.faq.findMany({
      where: { isActive: true, category: "trust" },
      orderBy: { sortOrder: "asc" },
      take: 4,
      select: { id: true, question: true, answer: true },
    }),
    prisma.caregiverProfile.groupBy({
      by: ["city", "state"],
      where: {
        isPublished: true,
        deletedAt: null,
        categories: { some: { categoryId: category.id } },
      },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
  ]);

  return (
    <>
      <section className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/search", label: "Find care" },
              { href: `/find-${slug}s`, label: category.name },
            ]}
          />
          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h1 className="display text-3xl leading-tight sm:text-[2.6rem]">
                Find a {category.singular.toLowerCase()} you can trust
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
                {category.longDescription ?? category.description}
              </p>
              <div className="mt-6">
                <SearchBar
                  categories={categories}
                  defaultType={slug}
                  variant="compact"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold">What to look for</p>
              <ul className="mt-3 space-y-2.5">
                {[
                  "Relevant years of experience and age ranges",
                  "Certifications you can verify with the issuer",
                  "Availability that matches your week",
                  "Reviews from families who actually hired",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-6 text-ink-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl bg-sand-50 p-3 text-[11px] leading-5 text-ink-500">
                Background checks and identity verification are completed for some caregivers, not
                all. Look for the badges on each profile.
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow={`${caregivers.total} ${category.name.toLowerCase()} available`}
          title={`${category.name} near you`}
          description="Ranked by experience and reviews. Using filters narrows results instantly."
          action={{ href: `/search?type=${slug}`, label: "Open advanced search" }}
        />
        {caregivers.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.items.slice(0, 6).map((caregiver) => (
              <CaregiverCard key={caregiver.id} caregiver={caregiver} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-sm font-medium">No published {category.name.toLowerCase()} yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New caregivers join every week. Create an account and we will notify you when someone
              matches.
            </p>
            <Button asChild className="mt-4">
              <Link href="/register?role=family">Create a free account</Link>
            </Button>
          </div>
        )}
      </Section>

      {cityCounts.length ? (
        <Section muted className="py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Popular locations for {category.name.toLowerCase()}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {cityCounts.map((row) => (
              <Link
                key={`${row.city}-${row.state}`}
                href={`/search?type=${slug}&city=${encodeURIComponent(row.city)}`}
                className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm text-ink-700 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {row.city}, {row.state}
                <span className="ml-1.5 text-xs text-muted-foreground">{row._count.city}</span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {jobs.items.length ? (
        <Section>
          <SectionHeading
            eyebrow="Open roles"
            title={`${category.name} jobs`}
            description="Families and agencies hiring for this category right now."
            action={{ href: `/care-jobs?type=${slug}`, label: "View all jobs" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.items.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </Section>
      ) : null}

      {faqs.length ? (
        <Section muted>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="display text-3xl leading-tight">Safety questions, answered</h2>
              <p className="mt-3 text-[15px] leading-7 text-ink-500">
                Our verification process is deliberately explicit. Read exactly what each badge means.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/safety">
                  Safety &amp; trust centre <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </Section>
      ) : null}
    </>
  );
}
