import { handler, jsonOk, assertSameOrigin, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import {
  agencyProfileSchema,
  caregiverProfileSchema,
  familyProfileSchema,
} from "@/lib/validators";
import { listToCsv } from "@/lib/json";
import { slugify } from "@/lib/utils";

export const PATCH = handler(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const body = await readJson<Record<string, unknown>>(req);

  if (user.role === "FAMILY") {
    const input = familyProfileSchema.parse(body);
    await prisma.$transaction([
      prisma.familyProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          headline: input.headline || null,
          about: input.about || null,
          childrenCount: input.childrenCount,
          childrenAges: listToCsv(input.childrenAges),
          careNeeds: listToCsv(input.careNeeds),
          addressLine: input.addressLine || null,
          city: input.city,
          state: input.state,
          zip: input.zip,
          emergencyContact: input.emergencyContact || null,
          onboardingComplete: true,
        },
        update: {
          headline: input.headline || null,
          about: input.about || null,
          childrenCount: input.childrenCount,
          childrenAges: listToCsv(input.childrenAges),
          careNeeds: listToCsv(input.careNeeds),
          addressLine: input.addressLine || null,
          city: input.city,
          state: input.state,
          zip: input.zip,
          emergencyContact: input.emergencyContact || null,
          onboardingComplete: true,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { city: input.city, state: input.state, zip: input.zip },
      }),
    ]);
    return jsonOk({ updated: true, role: user.role });
  }

  if (user.role === "CAREGIVER") {
    const input = caregiverProfileSchema.parse(body);
    const existing = await prisma.caregiverProfile.findUnique({ where: { userId: user.id } });

    let slug = existing?.slug;
    if (!slug) {
      const root = slugify(`${user.firstName} ${user.lastName}`) || `caregiver-${user.id.slice(-6)}`;
      let candidate = root;
      for (let i = 2; i < 50; i += 1) {
        const clash = await prisma.caregiverProfile.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!clash) break;
        candidate = `${root}-${i}`;
      }
      slug = candidate;
    }

    const categories = await prisma.careCategory.findMany({
      where: { slug: { in: input.categories ?? [] }, isActive: true },
      select: { id: true },
    });

    const profile = await prisma.$transaction(async (tx) => {
      const saved = await tx.caregiverProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          slug: slug!,
          headline: input.headline || null,
          bio: input.bio || null,
          city: input.city,
          state: input.state,
          zip: input.zip || null,
          yearsExperience: input.yearsExperience,
          hourlyRateCents: input.hourlyRateCents ?? null,
          rateType: input.rateType,
          employmentType: input.employmentType,
          livingArrangement: input.livingArrangement,
          minHoursPerWeek: input.minHoursPerWeek ?? null,
          maxHoursPerWeek: input.maxHoursPerWeek ?? null,
          willingToTravel: input.willingToTravel ?? false,
          travelRadiusKm: input.travelRadiusKm ?? 25,
          languages: listToCsv(input.languages),
          specialNeeds: listToCsv(input.specialNeeds),
          isPublished: input.isPublished ?? false,
          availableForWork: input.availableForWork ?? true,
        },
        update: {
          headline: input.headline || null,
          bio: input.bio || null,
          city: input.city,
          state: input.state,
          zip: input.zip || null,
          yearsExperience: input.yearsExperience,
          hourlyRateCents: input.hourlyRateCents ?? null,
          rateType: input.rateType,
          employmentType: input.employmentType,
          livingArrangement: input.livingArrangement,
          minHoursPerWeek: input.minHoursPerWeek ?? null,
          maxHoursPerWeek: input.maxHoursPerWeek ?? null,
          willingToTravel: input.willingToTravel ?? false,
          travelRadiusKm: input.travelRadiusKm ?? 25,
          languages: listToCsv(input.languages),
          specialNeeds: listToCsv(input.specialNeeds),
          isPublished: input.isPublished ?? existing?.isPublished ?? false,
          availableForWork: input.availableForWork ?? true,
        },
      });

      await tx.caregiverCategory.deleteMany({ where: { caregiverId: saved.id } });
      if (categories.length) {
        await tx.caregiverCategory.createMany({
          data: categories.map((category) => ({ caregiverId: saved.id, categoryId: category.id })),
        });
      }

      await tx.caregiverSkill.deleteMany({ where: { caregiverId: saved.id } });
      if (input.skills?.length) {
        await tx.caregiverSkill.createMany({
          data: input.skills.map((name) => ({ caregiverId: saved.id, name })),
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { city: input.city, state: input.state, zip: input.zip || null },
      });

      return saved;
    });

    return jsonOk({ updated: true, role: user.role, slug: profile.slug, published: profile.isPublished });
  }

  if (user.role === "AGENCY") {
    const input = agencyProfileSchema.parse(body);
    const existing = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });
    const slug =
      existing?.slug ??
      `${slugify(input.name) || "agency"}-${user.id.slice(-5)}`;

    await prisma.$transaction([
      prisma.agencyProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          slug,
          name: input.name,
          about: input.about || null,
          website: input.website || null,
          contactPhone: input.contactPhone || null,
          contactEmail: input.contactEmail || null,
          licenseNumber: input.licenseNumber || null,
          addressLine: input.addressLine || null,
          city: input.city,
          state: input.state,
          zip: input.zip,
        },
        update: {
          name: input.name,
          about: input.about || null,
          website: input.website || null,
          contactPhone: input.contactPhone || null,
          contactEmail: input.contactEmail || null,
          licenseNumber: input.licenseNumber || null,
          addressLine: input.addressLine || null,
          city: input.city,
          state: input.state,
          zip: input.zip,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { city: input.city, state: input.state, zip: input.zip },
      }),
    ]);
    return jsonOk({ updated: true, role: user.role });
  }

  throw ApiError.forbidden("Administrator profiles are managed in the admin panel.");
});
