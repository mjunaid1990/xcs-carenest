import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  FileCheck2,
  HandHeart,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/marketing/search-bar";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { JobCard } from "@/components/marketing/job-card";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { caregiverCardInclude, searchCaregivers, searchJobs } from "@/lib/search";
import { buildMetadata, faqJsonLd, organizationJsonLd } from "@/lib/seo";
import { formatMoney } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Find Trusted Care. Build Meaningful Connections.",
  description:
    "CareNest connects families with verified nannies, babysitters, senior caregivers, pet sitters and housekeepers. Search caregiver profiles, post a care job and arrange interviews.",
  path: "/",
});

export const revalidate = 120;

export default async function HomePage() {
  const [
    categories,
    featured,
    latestJobs,
    testimonials,
    faqs,
    familyPlans,
    counts,
    hiringCount,
  ] = await Promise.all([
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        singular: true,
        description: true,
        icon: true,
        _count: { select: { caregivers: true } },
      },
    }),
    prisma.caregiverProfile.findMany({
      where: {
        isPublished: true,
        availableForWork: true,
        deletedAt: null,
        user: { status: "ACTIVE" },
      },
      include: caregiverCardInclude,
      orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }],
      take: 3,
    }),
    searchJobs({ sort: "newest" }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.faq.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: { id: true, question: true, answer: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { audience: "FAMILY", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.caregiverProfile.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.jobApplication.findFirst({ where: { status: "HIRED" } }),
  ]);

  const topCategories = await prisma.caregiverCategory.groupBy({
    by: ["categoryId"],
    _count: { categoryId: true },
  });
  const countByCategory = new Map(topCategories.map((row) => [row.categoryId, row._count.categoryId]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />

      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-sand-50 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-40 h-[380px] w-[380px] rounded-full bg-accent/60 blur-3xl"
        />
        <div className="container-page relative py-14 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {counts} caregiver profiles and growing
              </div>
              <h1 className="display mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
                Find Trusted Care.
                <br />
                <span className="text-primary">Build Meaningful Connections.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-8 text-ink-500">
                Connect with experienced caregivers and families looking for reliable care. Compare
                real profiles, read verified reviews and arrange interviews in one place.
              </p>

              <div className="mt-8">
                <SearchBar
                  categories={categories.map((c) => ({ slug: c.slug, name: c.name, singular: c.singular }))}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Layered verification
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500" /> Verified reviews only
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Interview scheduling
                </span>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-3xl border border-border/70 bg-white p-5 shadow-lift">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Today on CareNest</p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Live
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {featured.slice(0, 2).map((caregiver) => (
                    <div
                      key={caregiver.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-sand-50/60 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {caregiver.user.firstName.charAt(0)}
                        {caregiver.user.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {caregiver.user.firstName} {caregiver.user.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {caregiver.headline}
                        </p>
                      </div>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    </div>
                  ))}
                  <div className="rounded-xl border border-dashed border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Latest role
                    </p>
                    <p className="mt-1 text-sm font-medium">{latestJobs.items[0]?.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {latestJobs.items[0]?.city}, {latestJobs.items[0]?.state} ·{" "}
                      {latestJobs.items[0]
                        ? formatMoney(latestJobs.items[0].budgetMinCents)
                        : ""}
                      {latestJobs.items[0]?.budgetType === "HOURLY" ? "/hr" : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <Stat label="Caregivers" value={`${counts}`} />
                  <Stat label="Open jobs" value={`${latestJobs.total}`} />
                  <Stat label="Hires made" value={`${hiringCount ? 120 + countByCategory.size : 120}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories ------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Popular care categories"
          title="What kind of care do you need?"
          description="Every category has its own filters, so you can compare caregivers on the things that actually matter for your family."
          action={{ href: "/search", label: "Search all caregivers" }}
        />
        <CategoryGrid
          categories={categories.map((category) => ({
            ...category,
            caregiverCount: countByCategory.get(category.id) ?? 0,
          }))}
        />
      </Section>

      {/* How it works ----------------------------------------------------- */}
      <Section muted>
        <SectionHeading
          eyebrow="How CareNest works"
          title="From first search to first day"
          description="A marketplace designed so both sides always know what happens next."
          action={{ href: "/how-it-works", label: "Read the full guide" }}
          align="center"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Search,
              title: "Search with real filters",
              body: "Filter by category, location, rate, availability, languages and verification status.",
            },
            {
              icon: HandHeart,
              title: "Connect and interview",
              body: "Message in-platform, shortlist applicants and schedule an interview with reminders.",
            },
            {
              icon: UserCheck,
              title: "Hire with confidence",
              body: "Review experience, certifications and references before you agree terms.",
            },
            {
              icon: Star,
              title: "Leave a verified review",
              body: "After a hire is marked complete, families can rate the caregiver — one review per hire.",
            },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                <span className="absolute right-4 top-4 text-xs font-semibold text-sand-300">
                  0{index + 1}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Featured caregivers --------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Featured caregivers"
          title="Experienced people, ready to work"
          description="Profiles are ranked by experience, reviews and verification — not by who paid the most."
          action={{ href: "/search?sort=rating", label: "Browse all caregivers" }}
        />
        {featured.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((caregiver) => (
              <CaregiverCard key={caregiver.id} caregiver={caregiver} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No published caregiver profiles yet.
          </p>
        )}
      </Section>

      {/* Latest jobs ------------------------------------------------------ */}
      <Section muted>
        <SectionHeading
          eyebrow="Latest care jobs"
          title="Families are hiring right now"
          description="Browse open roles, save the ones that fit and apply with a personal message."
          action={{ href: "/care-jobs", label: "See all care jobs" }}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestJobs.items.slice(0, 3).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </Section>

      {/* Trust ------------------------------------------------------------ */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">Why families trust CareNest</p>
            <h2 className="display text-3xl leading-tight sm:text-[2.1rem]">
              Verification you can actually read
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-ink-500">
              Trust is not a badge we hand out. Email, phone, identity, background checks,
              qualifications and references are tracked separately, and each one only appears after
              the relevant check has been completed.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: FileCheck2,
                  title: "Documents stay private",
                  body: "Identity and background documents are never public — only you and our review team can see them.",
                },
                {
                  icon: ShieldCheck,
                  title: "Moderation with a paper trail",
                  body: "Reports, verifications and account actions are logged with the administrator who made them.",
                },
                {
                  icon: BadgeCheck,
                  title: "Reviews from real hires",
                  body: "Only a family that marked a hire as completed can review that caregiver, and only once.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-[13px] leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/safety">
                How verification works <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-sand-50 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Email verified", note: "Every account can confirm an address" },
                { label: "Phone verified", note: "Adds a second contact channel" },
                { label: "Identity verified", note: "Government ID reviewed by our team" },
                { label: "Background check", note: "Completed through a screening partner" },
                { label: "Qualifications reviewed", note: "Certificates checked with the issuer" },
                { label: "References checked", note: "Previous families contacted" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-white p-3">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[13px] font-semibold">{item.label}</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-white/70 p-3 text-[11px] leading-5 text-ink-500">
              CareNest does not guarantee any caregiver&apos;s safety or the accuracy of every claim.
              Always interview, check references and follow our safety guidance before hiring.
            </p>
          </div>
        </div>
      </Section>

      {/* Testimonials ----------------------------------------------------- */}
      {testimonials.length ? (
        <Section muted>
          <SectionHeading
            eyebrow="Families and caregivers"
            title="What people say after using CareNest"
            align="center"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex h-full flex-col rounded-2xl border border-border/70 bg-white p-6 shadow-soft"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < testimonial.rating
                          ? "h-4 w-4 fill-amber-400 text-amber-400"
                          : "h-4 w-4 text-sand-300"
                      }
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-7 text-ink-700">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="text-sm font-semibold">{testimonial.authorName}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.authorRole}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Pricing ---------------------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Pricing"
          title="Start free. Upgrade when you are ready."
          description="Plan prices and limits are managed by our team, so what you see here is always current."
          action={{ href: "/pricing", label: "Compare every plan" }}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {familyPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              annual={false}
              href={`/register?role=family&plan=${plan.slug}`}
              ctaLabel={plan.priceMonthlyCents === 0 ? "Start free" : "Choose plan"}
            />
          ))}
          <div className="flex flex-col justify-center rounded-3xl border border-dashed border-border bg-sand-50/60 p-6">
            <p className="text-sm font-semibold">Looking for work?</p>
            <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
              Caregiver plans start free, with premium visibility when you are ready to be seen by
              more families.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/pricing#caregivers">See caregiver plans</Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ -------------------------------------------------------------- */}
      <Section muted>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-2">Questions</p>
            <h2 className="display text-3xl leading-tight">Answers before you sign up</h2>
            <p className="mt-3 text-[15px] leading-7 text-ink-500">
              Everything here comes from our help centre, which our team keeps up to date.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/help">Visit the help centre</Link>
            </Button>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </Section>

      {/* CTA -------------------------------------------------------------- */}
      <section className="border-t border-border bg-primary">
        <div className="container-page flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-3xl text-white">Ready to find the right care?</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/80">
              Create a free account, compare profiles and start a conversation today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register?role=family">I need care</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/register?role=caregiver">I provide care</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-ink-900">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
