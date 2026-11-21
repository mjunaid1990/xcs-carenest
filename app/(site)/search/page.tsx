import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { searchCaregivers } from "@/lib/search";
import { searchParamsToState } from "@/lib/search-params";
import { searchParamsSchema } from "@/lib/validators";
import { Breadcrumbs, Section } from "@/components/marketing/section";
import { SearchFilters, ResultsToolbar } from "@/components/marketplace/search-filters";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { SaveButton } from "@/components/marketplace/save-button";
import { MapPanel } from "@/components/marketplace/map-panel";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { rateLabel } from "@/lib/presentation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Search caregivers",
  description:
    "Search caregiver profiles by category, location, rate, availability, experience, languages and verification status.",
  path: "/search",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = searchParamsSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    )
  );
  const state = searchParamsToState(parsed);

  const [user, categories, results] = await Promise.all([
    getSessionUser(),
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, singular: true },
    }),
    searchCaregivers(state),
  ]);

  const savedCaregivers =
    user && results.items.length
      ? await prisma.savedCaregiver.findMany({
          where: { userId: user.id, caregiverId: { in: results.items.map((c) => c.id) } },
          select: { caregiverId: true },
        })
      : [];
  const savedSet = new Set(savedCaregivers.map((row) => row.caregiverId));

  const view = parsed.view ?? "grid";
  const activeCategory = categories.find((c) => c.slug === parsed.type);

  return (
    <>
      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/search", label: "Find care" },
              ...(activeCategory ? [{ href: `/search?type=${activeCategory.slug}`, label: activeCategory.name }] : []),
            ]}
          />
          <h1 className="display text-3xl">
            {activeCategory ? `${activeCategory.name} near you` : "Find a caregiver"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
            {results.total} published profile{results.total === 1 ? "" : "s"} match your filters.
            Every result comes from a real, published caregiver account.
          </p>
        </div>
      </div>

      <Section className="py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <SearchFilters categories={categories} total={results.total} />
          </aside>

          <div>
            <ResultsToolbar total={results.total} />

            {results.items.length === 0 ? (
              <EmptyState
                icon="search"
                title="No caregivers match those filters"
                description="Try widening the location, raising the maximum rate, or clearing verification filters."
                action={{ href: "/search", label: "Clear all filters" }}
              />
            ) : view === "map" ? (
              <MapPanel
                city={parsed.city}
                state={parsed.state}
                results={results.items.map((caregiver) => ({
                  slug: caregiver.slug,
                  name: `${caregiver.user.firstName} ${caregiver.user.lastName}`,
                  city: caregiver.city,
                  state: caregiver.state,
                  rate: rateLabel(caregiver),
                }))}
              />
            ) : (
              <>
                <div
                  className={
                    view === "list"
                      ? "grid gap-4"
                      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  }
                >
                  {results.items.map((caregiver) => (
                    <CaregiverCard
                      key={caregiver.id}
                      caregiver={caregiver}
                      view={view === "list" ? "list" : "grid"}
                      action={
                        <SaveButton
                          kind="caregiver"
                          id={caregiver.id}
                          initialSaved={savedSet.has(caregiver.id)}
                          isAuthenticated={Boolean(user)}
                          compact
                        />
                      }
                    />
                  ))}
                </div>
                <Pagination page={results.page} pageCount={results.pageCount} className="mt-8" />
              </>
            )}

            {!user ? (
              <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-soft/60 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold">Create a free account to contact caregivers</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Save profiles, message caregivers and track your conversations in one place.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href="/register?role=family">Join free</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login">Log in</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Section>
    </>
  );
}
