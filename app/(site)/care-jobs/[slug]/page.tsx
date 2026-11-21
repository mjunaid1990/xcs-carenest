import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Languages,
  MapPin,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { buildMetadata, absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { Breadcrumbs } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/marketing/job-card";
import { ApplyDialog } from "@/components/marketplace/apply-dialog";
import { SaveButton } from "@/components/marketplace/save-button";
import { SafetyDisclaimer } from "@/components/marketing/verification";
import { budgetLabel, employmentTypeLabel, livingLabel } from "@/lib/presentation";
import { csvToList } from "@/lib/json";
import { formatDate, timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await prisma.careJob.findUnique({ where: { slug } });
  if (!job) notFound();
  return buildMetadata({
    title: job.title,
    description: job.description.slice(0, 155),
    path: `/care-jobs/${job.slug}`,
  });
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getSessionUser();

  const job = await prisma.careJob.findUnique({
    where: { slug },
    include: {
      category: true,
      requirements: { orderBy: { sortOrder: "asc" } },
      agency: { select: { name: true, slug: true, ratingAvg: true, ratingCount: true } },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          createdAt: true,
          familyProfile: { select: { headline: true, childrenCount: true } },
        },
      },
      _count: { select: { applications: true } },
    },
  });

  if (!job || job.deletedAt) notFound();
  const isOwner = viewer?.id === job.ownerId;
  if (job.status !== "PUBLISHED" && !isOwner && viewer?.role !== "ADMIN") notFound();

  const [caregiverProfile, application, saved, related] = await Promise.all([
    viewer
      ? prisma.caregiverProfile.findUnique({
          where: { userId: viewer.id },
          select: { id: true, isPublished: true },
        })
      : Promise.resolve(null),
    viewer && viewer.role === "CAREGIVER"
      ? prisma.jobApplication.findFirst({
          where: { jobId: job.id, caregiver: { userId: viewer.id } },
          select: { id: true, status: true },
        })
      : Promise.resolve(null),
    viewer
      ? prisma.savedJob.findUnique({ where: { userId_jobId: { userId: viewer.id, jobId: job.id } } })
      : Promise.resolve(null),
    prisma.careJob.findMany({
      where: {
        id: { not: job.id },
        status: "PUBLISHED",
        deletedAt: null,
        OR: [{ categoryId: job.categoryId }, { city: job.city }],
      },
      include: { category: { select: { name: true, singular: true } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  // Increment the view counter once per visit (skips the owner's own visits).
  if (!isOwner) {
    await prisma.careJob.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } });
  }

  const languages = csvToList(job.languages);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: job.title,
            description: job.description,
            datePosted: job.publishedAt?.toISOString() ?? job.createdAt.toISOString(),
            employmentType:
              job.employmentType === "FULL_TIME"
                ? "FULL_TIME"
                : job.employmentType === "PART_TIME"
                  ? "PART_TIME"
                  : "TEMPORARY",
            hiringOrganization: {
              "@type": "Organization",
              name: job.agency?.name ?? "CareNest family",
            },
            jobLocation: {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressLocality: job.city,
                addressRegion: job.state,
                postalCode: job.zip ?? undefined,
                addressCountry: "US",
              },
            },
            baseSalary: {
              "@type": "MonetaryAmount",
              currency: "USD",
              value: {
                "@type": "QuantitativeValue",
                minValue: job.budgetMinCents / 100,
                maxValue: (job.budgetMaxCents ?? job.budgetMinCents) / 100,
                unitText: job.budgetType === "HOURLY" ? "HOUR" : job.budgetType === "DAILY" ? "DAY" : "MONTH",
              },
            },
            url: absoluteUrl(`/care-jobs/${job.slug}`),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Care jobs", path: "/care-jobs" },
              { name: job.title, path: `/care-jobs/${job.slug}` },
            ])
          ),
        }}
      />

      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/care-jobs", label: "Care jobs" },
              { href: `/care-jobs/${job.slug}`, label: job.category.name },
            ]}
          />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {job.category.name}
              </p>
              <h1 className="display mt-1 text-3xl leading-tight sm:text-4xl">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {job.city}, {job.state}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {employmentTypeLabel(job.employmentType)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {livingLabel(job.livingArrangement)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {job._count.applications} applicant
                  {job._count.applications === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="text-sm">{budgetLabel(job)}</Badge>
                {job.status !== "PUBLISHED" ? <Badge variant="warning">{job.status}</Badge> : null}
                {job.isFeatured ? <Badge variant="accent">Featured</Badge> : null}
                <span className="text-xs text-muted-foreground">
                  Posted {timeAgo(job.publishedAt ?? job.createdAt)} · {job.viewCount} views
                </span>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-2 rounded-2xl border border-border/70 bg-white p-4 shadow-soft">
              <ApplyDialog
                jobSlug={job.slug}
                jobTitle={job.title}
                isAuthenticated={Boolean(viewer)}
                canApply={viewer?.role === "CAREGIVER"}
                alreadyApplied={Boolean(application)}
                profileIncomplete={Boolean(caregiverProfile && !caregiverProfile.isPublished)}
              />
              {application ? (
                <p className="text-center text-xs text-muted-foreground">
                  Status: <span className="font-medium">{application.status}</span> ·{" "}
                  <Link href="/dashboard/caregiver/applications" className="text-primary underline">
                    Track application
                  </Link>
                </p>
              ) : null}
              <SaveButton
                kind="job"
                id={job.id}
                initialSaved={Boolean(saved)}
                isAuthenticated={Boolean(viewer)}
                className="w-full"
              />
              {isOwner ? (
                <p className="text-center text-xs text-muted-foreground">
                  This is your job. <Link href="/dashboard/family/jobs" className="text-primary underline">Manage it</Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-[15px] leading-7 text-ink-700">{job.description}</p>
            </CardContent>
          </Card>

          {job.requirements.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {job.requirements.map((requirement) => (
                    <li key={requirement.id} className="flex items-start gap-2 text-sm text-ink-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {requirement.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Schedule & details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Detail label="Working schedule" value={job.schedule} />
              <Detail
                label="Start date"
                value={job.startDate ? formatDate(job.startDate) : "Flexible"}
              />
              <Detail
                label="Duration"
                value={job.durationMonths ? `${job.durationMonths} months` : "Ongoing"}
              />
              <Detail label="Caregivers needed" value={String(job.caregiversNeeded)} />
              <Detail label="Experience required" value={`${job.experienceYears}+ years`} />
              <Detail
                label="Languages"
                value={languages.length ? languages.join(", ") : "Not specified"}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Posted by</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold">
                {job.agency?.name ?? `${job.owner.firstName} ${job.owner.lastName}`}
              </p>
              <p className="text-sm text-ink-500">
                {job.owner.familyProfile?.headline ??
                  (job.agency ? "Licensed childcare agency" : "Family on CareNest")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.owner.emailVerifiedAt ? <Badge variant="muted">Email verified</Badge> : null}
                {job.owner.phoneVerifiedAt ? <Badge variant="muted">Phone verified</Badge> : null}
                {job.agency ? <Badge variant="success">Agency</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Member since {formatDate(job.owner.createdAt, { month: "long", year: "numeric" })}
              </p>
              <SafetyDisclaimer className="border-t border-border pt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Before you apply</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-ink-500">
                <li className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" /> Check the start date works
                  for you.
                </li>
                <li className="flex gap-2">
                  <Languages className="mt-0.5 h-4 w-4 text-primary" /> Mention languages and
                  certifications in your message.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> Never pay a family to apply
                  for a job.
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {related.length ? (
        <div className="border-t border-border/60 bg-sand-50">
          <div className="container-page py-12">
            <h2 className="display text-2xl">Similar care jobs</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <JobCard key={item.id} job={item} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
