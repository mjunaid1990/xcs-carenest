import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { caregiverCardInclude } from "@/lib/search";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { JobCard } from "@/components/marketing/job-card";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

async function loadLocation(slug: string) {
  return prisma.location.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const location = await loadLocation(slug);
  if (!location) notFound();
  return buildMetadata({
    title: `Care in ${location.city}, ${location.stateCode}`,
    description:
      location.description ||
      `Find nannies, babysitters and senior caregivers in ${location.city}, ${location.state}.`,
    path: `/locations/${location.slug}`,
  });
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = await loadLocation(slug);
  if (!location) notFound();

  const [caregivers, jobs] = await Promise.all([
    prisma.caregiverProfile.findMany({
      where: {
        isPublished: true,
        availableForWork: true,
        deletedAt: null,
        city: location.city,
        state: location.state,
        user: { status: "ACTIVE" },
      },
      include: caregiverCardInclude,
      orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }],
      take: 6,
    }),
    prisma.careJob.findMany({
      where: { status: "PUBLISHED", deletedAt: null, city: location.city, state: location.state },
      include: {
        category: { select: { name: true, singular: true } },
        owner: { select: { firstName: true, lastName: true } },
        agency: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <>
      <section className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location.state}</p>
          <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">
            Care in {location.city}, {location.stateCode}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
            {location.description || `Compare local caregivers and open care jobs in ${location.city}.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/search?city=${encodeURIComponent(location.city)}&state=${encodeURIComponent(location.state)}`}>
                <Search className="h-4 w-4" /> Search caregivers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/care-jobs?city=${encodeURIComponent(location.city)}`}>Browse care jobs</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container-page space-y-12 py-12">
        <section>
          <h2 className="display mb-4 text-2xl">Caregivers in {location.city}</h2>
          {caregivers.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {caregivers.map((caregiver) => (
                <CaregiverCard key={caregiver.id} caregiver={caregiver} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No published caregiver profiles in {location.city} yet.{" "}
              <Link href={`/search?city=${encodeURIComponent(location.city)}`} className="text-primary hover:underline">
                Search nearby areas
              </Link>
              .
            </p>
          )}
        </section>

        <section>
          <h2 className="display mb-4 text-2xl">Open care jobs in {location.city}</h2>
          {jobs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No open jobs in {location.city} right now.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
