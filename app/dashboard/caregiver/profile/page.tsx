import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvToList } from "@/lib/json";
import { PageHeader } from "@/components/dashboard/page-header";
import { CaregiverProfileForm } from "./caregiver-profile-form";

export const dynamic = "force-dynamic";

export default async function CaregiverProfilePage() {
  const user = await requireRole("CAREGIVER");
  const [categories, profile] = await Promise.all([
    prisma.careCategory.findMany({
      where: { isActive: true, isCareType: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.caregiverProfile.findUnique({
      where: { userId: user.id },
      include: { categories: { include: { category: { select: { slug: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My caregiver profile"
        description="This is what families see. Published profiles appear in search and category pages."
      />
      <CaregiverProfileForm
        categories={categories}
        initial={{
          headline: profile?.headline ?? "",
          bio: profile?.bio ?? "",
          city: profile?.city ?? user.city ?? "",
          state: profile?.state ?? user.state ?? "",
          zip: profile?.zip ?? user.zip ?? "",
          yearsExperience: profile?.yearsExperience ?? 0,
          hourlyRateCents: profile?.hourlyRateCents ?? null,
          rateType: profile?.rateType ?? "HOURLY",
          employmentType: profile?.employmentType ?? "BOTH",
          livingArrangement: profile?.livingArrangement ?? "BOTH",
          languages: csvToList(profile?.languages),
          categories: profile?.categories.map((row) => row.category.slug) ?? [],
          isPublished: profile?.isPublished ?? false,
          availableForWork: profile?.availableForWork ?? true,
        }}
      />
    </div>
  );
}
