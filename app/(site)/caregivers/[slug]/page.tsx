import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  Clock,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { buildMetadata, breadcrumbJsonLd, absoluteUrl } from "@/lib/seo";
import { Breadcrumbs } from "@/components/marketing/section";
import { Rating } from "@/components/marketing/rating";
import { VerificationBadges, SafetyDisclaimer } from "@/components/marketing/verification";
import { ProfileActions } from "@/components/marketplace/profile-actions";
import { SaveButton } from "@/components/marketplace/save-button";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caregiverCardInclude } from "@/lib/search";
import {
  availabilitySummary,
  employmentTypeLabel,
  livingLabel,
  rateLabel,
} from "@/lib/presentation";
import { caregiverCompletion } from "@/lib/profile-completion";
import { DAY_NAMES, formatDate, initials, minutesToLabel } from "@/lib/utils";
import { csvToList } from "@/lib/json";
import { Progress } from "@/components/ui/feedback";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caregiver = await prisma.caregiverProfile.findUnique({
    where: { slug },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!caregiver) notFound();

  const name = `${caregiver.user.firstName} ${caregiver.user.lastName}`;
  return buildMetadata({
    title: `${name} — ${caregiver.headline ?? "Caregiver"}`,
    description:
      caregiver.bio?.slice(0, 155) ??
      `${name} is a caregiver in ${caregiver.city}, ${caregiver.state} on CareNest.`,
    path: `/caregivers/${caregiver.slug}`,
    type: "profile",
  });
}

export default async function CaregiverProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getSessionUser();

  const caregiver = await prisma.caregiverProfile.findUnique({
    where: { slug },
    include: {
      ...caregiverCardInclude,
      user: { select: { id: true, firstName: true, lastName: true, status: true, avatarUrl: true, emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true } },
      experiences: { orderBy: { startDate: "desc" } },
      certifications: { orderBy: { createdAt: "desc" } },
      categories: { include: { category: true } },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { author: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
    },
  });

  if (!caregiver || caregiver.deletedAt || caregiver.user.status !== "ACTIVE") notFound();
  const isOwner = viewer?.id === caregiver.userId;
  if (!caregiver.isPublished && !isOwner && viewer?.role !== "ADMIN") notFound();

  // Count a profile view once per non-owner page load (best-effort analytics).
  if (!isOwner) {
    await prisma.$transaction([
      prisma.caregiverProfile.update({
        where: { id: caregiver.id },
        data: { profileViews: { increment: 1 } },
      }),
      prisma.profileView.create({
        data: { caregiverId: caregiver.id, viewerId: viewer?.id ?? null },
      }),
    ]);
  }

  const [completion, saved, related] = await Promise.all([
    caregiverCompletion(caregiver.id, caregiver.userId),
    viewer
      ? prisma.savedCaregiver.findUnique({
          where: { userId_caregiverId: { userId: viewer.id, caregiverId: caregiver.id } },
        })
      : Promise.resolve(null),
    prisma.caregiverProfile.findMany({
      where: {
        id: { not: caregiver.id },
        isPublished: true,
        deletedAt: null,
        OR: [{ city: caregiver.city }, { categories: { some: { categoryId: caregiver.categories[0]?.categoryId } } }],
      },
      include: caregiverCardInclude,
      orderBy: { ratingAvg: "desc" },
      take: 3,
    }),
  ]);

  const name = `${caregiver.user.firstName} ${caregiver.user.lastName}`;
  const location = `${caregiver.city}, ${caregiver.state}`;
  const languages = csvToList(caregiver.languages);
  const specialNeeds = csvToList(caregiver.specialNeeds);

  const availabilityByDay = new Map<number, typeof caregiver.availability>();
  for (const slot of caregiver.availability) {
    const list = availabilityByDay.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    availabilityByDay.set(slot.dayOfWeek, list);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name,
            jobTitle: caregiver.headline ?? "Caregiver",
            description: caregiver.bio ?? undefined,
            address: {
              "@type": "PostalAddress",
              addressLocality: caregiver.city,
              addressRegion: caregiver.state,
            },
            url: absoluteUrl(`/caregivers/${caregiver.slug}`),
            aggregateRating:
              caregiver.ratingCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: caregiver.ratingAvg.toFixed(1),
                    reviewCount: caregiver.ratingCount,
                  }
                : undefined,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Caregivers", path: "/search" },
              { name, path: `/caregivers/${caregiver.slug}` },
            ])
          ),
        }}
      />

      <div className="border-b border-border/60 bg-sand-50">
        <div className="container-page py-8">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/search", label: "Find care" },
              { href: `/caregivers/${caregiver.slug}`, label: name },
            ]}
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-3xl font-semibold text-primary">
              {caregiver.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={caregiver.photoUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                initials(caregiver.user.firstName, caregiver.user.lastName)
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="display text-3xl">{name}</h1>
                {!caregiver.isPublished ? <Badge variant="warning">Draft profile</Badge> : null}
                {caregiver.isFeatured ? <Badge variant="accent">Featured</Badge> : null}
              </div>
              <p className="mt-1 text-[15px] text-ink-700">{caregiver.headline}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {location}
                </span>
                <Rating value={caregiver.ratingAvg} count={caregiver.ratingCount} />
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> {caregiver.yearsExperience} years experience
                </span>
                <span className="font-semibold text-primary">{rateLabel(caregiver)}</span>
              </div>

              <VerificationBadges
                className="mt-3"
                flags={{
                  emailVerified: Boolean(caregiver.user.emailVerifiedAt),
                  phoneVerified: Boolean(caregiver.user.phoneVerifiedAt),
                  identityVerified: Boolean(caregiver.identityVerifiedAt),
                  backgroundChecked: Boolean(caregiver.backgroundCheckAt),
                  qualificationsVerified: Boolean(caregiver.qualificationsVerifiedAt),
                  referencesVerified: Boolean(caregiver.referencesVerifiedAt),
                }}
              />

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <ProfileActions
                  caregiverId={caregiver.id}
                  caregiverName={name}
                  isAuthenticated={Boolean(viewer)}
                  isOwner={isOwner}
                  contactAllowed
                />
                <SaveButton
                  kind="caregiver"
                  id={caregiver.id}
                  initialSaved={Boolean(saved)}
                  isAuthenticated={Boolean(viewer)}
                  compact={false}
                />
              </div>
            </div>

            {isOwner ? (
              <div className="w-full rounded-2xl border border-border/70 bg-white p-4 sm:w-56">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile completion
                </p>
                <p className="mt-1 text-2xl font-semibold">{completion.percent}%</p>
                <Progress value={completion.percent} className="mt-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {completion.steps.filter((step) => !step.done).length} steps remaining
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {caregiver.user.firstName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line text-[15px] leading-7 text-ink-700">
                {caregiver.bio ?? "This caregiver has not written an introduction yet."}
              </p>
              {languages.length ? (
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Languages className="h-4 w-4 text-primary" />
                  {languages.map((language) => (
                    <Badge key={language} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {caregiver.categories.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {caregiver.categories.map((row) => (
                    <Badge key={row.categoryId} variant="secondary">
                      {row.category.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work experience</CardTitle>
            </CardHeader>
            <CardContent>
              {caregiver.experiences.length ? (
                <ol className="space-y-5">
                  {caregiver.experiences.map((experience) => (
                    <li key={experience.id} className="relative border-l border-border pl-5">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-semibold">{experience.title}</p>
                      <p className="text-sm text-ink-500">{experience.employer}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(experience.startDate, { month: "short", year: "numeric" })} –{" "}
                        {experience.isCurrent
                          ? "Present"
                          : experience.endDate
                            ? formatDate(experience.endDate, { month: "short", year: "numeric" })
                            : "—"}
                      </p>
                      {experience.description ? (
                        <p className="mt-1.5 text-sm leading-6 text-ink-500">{experience.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No work history has been added yet. Ask about previous roles during your interview.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills & qualifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Skills
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {caregiver.skills.length ? (
                    caregiver.skills.map((skill) => (
                      <Badge key={skill.name} variant="outline">
                        {skill.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills listed.</p>
                  )}
                </div>
              </div>

              {specialNeeds.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Special needs experience
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {specialNeeds.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Certifications
                </p>
                {caregiver.certifications.length ? (
                  <ul className="mt-2 space-y-2">
                    {caregiver.certifications.map((certification) => (
                      <li
                        key={certification.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{certification.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {certification.issuer ?? "Issuer not listed"}
                            {certification.issuedAt
                              ? ` · issued ${formatDate(certification.issuedAt, { month: "short", year: "numeric" })}`
                              : ""}
                          </p>
                        </div>
                        {certification.verifiedAt ? (
                          <Badge variant="success">
                            <ShieldCheck className="h-3 w-3" /> Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="muted">Not reviewed</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No certifications uploaded. Always confirm certificates directly with the issuer.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews from families</CardTitle>
            </CardHeader>
            <CardContent>
              {caregiver.reviews.length ? (
                <ul className="space-y-5">
                  {caregiver.reviews.map((review) => (
                    <li key={review.id} className="border-b border-border/60 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {review.author.firstName} {review.author.lastName.charAt(0)}.
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Rating value={review.rating} showValue={false} />
                            {review.isVerified ? (
                              <Badge variant="success">Verified hire</Badge>
                            ) : (
                              <Badge variant="muted">Unverified</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.title ? (
                        <p className="mt-2 text-sm font-medium">{review.title}</p>
                      ) : null}
                      <p className="mt-1 text-sm leading-6 text-ink-700">{review.body}</p>
                      {review.responseBody ? (
                        <div className="mt-3 rounded-xl bg-sand-50 p-3">
                          <p className="text-xs font-semibold text-ink-700">
                            Response from {caregiver.user.firstName}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-ink-500">{review.responseBody}</p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No published reviews yet. Reviews only come from families who hired this caregiver
                  on CareNest.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Employment preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Rate" value={rateLabel(caregiver)} />
              <Row label="Employment" value={employmentTypeLabel(caregiver.employmentType)} />
              <Row label="Living arrangement" value={livingLabel(caregiver.livingArrangement)} />
              <Row
                label="Hours per week"
                value={
                  caregiver.minHoursPerWeek
                    ? `${caregiver.minHoursPerWeek}–${caregiver.maxHoursPerWeek ?? 40} hrs`
                    : "Flexible"
                }
              />
              <Row
                label="Travel"
                value={caregiver.willingToTravel ? `Up to ${caregiver.travelRadiusKm} km` : "Not willing to travel"}
              />
              <Row
                label="Available from"
                value={caregiver.availableFrom ? formatDate(caregiver.availableFrom) : "Immediately"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-500">
                <Clock className="h-4 w-4 text-primary" />
                {availabilitySummary(caregiver.availability)}
              </p>
              <ul className="space-y-1.5">
                {DAY_NAMES.map((day, index) => {
                  const slots = availabilityByDay.get(index) ?? [];
                  return (
                    <li key={day} className="flex items-center justify-between text-sm">
                      <span className="text-ink-500">{day}</span>
                      <span className={slots.length ? "font-medium" : "text-muted-foreground"}>
                        {slots.length
                          ? slots
                              .map(
                                (slot) =>
                                  `${minutesToLabel(slot.startMinute)}–${minutesToLabel(slot.endMinute)}`
                              )
                              .join(", ")
                          : "Unavailable"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Times shown in the caregiver&apos;s local timezone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust & safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-amber-500" />
                <span>
                  {caregiver.ratingCount > 0
                    ? `${caregiver.ratingAvg.toFixed(1)} average from ${caregiver.ratingCount} review${caregiver.ratingCount === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>{caregiver.completedHires} completed hires on CareNest</span>
              </div>
              <SafetyDisclaimer className="border-t border-border pt-3" />
              <Button asChild variant="link" className="h-auto p-0 text-xs">
                <Link href="/safety">Read our verification guide</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {related.length ? (
        <div className="border-t border-border/60 bg-sand-50">
          <div className="container-page py-12">
            <h2 className="display text-2xl">Similar caregivers</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <CaregiverCard key={item.id} caregiver={item} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
