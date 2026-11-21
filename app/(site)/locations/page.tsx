import Link from "next/link";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Care by location",
  description: "Find nannies, babysitters and senior caregivers in cities across the United States.",
  path: "/locations",
});

export const revalidate = 600;

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { stateCode: "asc" }, { city: "asc" }],
  });

  const byState = new Map<string, typeof locations>();
  for (const location of locations) {
    const list = byState.get(location.state) ?? [];
    list.push(location);
    byState.set(location.state, list);
  }

  return (
    <>
      <section className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-12 sm:py-16">
          <p className="eyebrow">Locations</p>
          <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">Care near you</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-500">
            Browse caregivers and open care jobs by city. Every listing below links to live,
            database-backed results.
          </p>
        </div>
      </section>

      <div className="container-page py-12">
        {!locations.length ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No locations have been published yet.
          </p>
        ) : (
          <div className="space-y-8">
            {Array.from(byState.entries()).map(([state, cities]) => (
              <section key={state}>
                <h2 className="display text-2xl">{state}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cities.map((location) => (
                    <Link
                      key={location.id}
                      href={`/locations/${location.slug}`}
                      className="group rounded-2xl border border-border/70 bg-white p-5 shadow-soft transition-colors hover:border-primary/40"
                    >
                      <p className="flex items-center gap-2 text-base font-semibold">
                        <MapPin className="h-4 w-4 text-primary" /> {location.city}, {location.stateCode}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-ink-500">
                        {location.description || `Find care in ${location.city}, ${location.state}.`}
                      </p>
                      <span className="mt-3 inline-block text-xs font-semibold text-primary group-hover:underline">
                        View caregivers and jobs →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
