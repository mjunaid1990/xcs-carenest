import { prisma } from "@/lib/prisma";
import { csvToList } from "@/lib/json";

/**
 * Profile completeness scoring. Used on the caregiver dashboard and profile
 * editor so the "finish your profile" checklist is derived from real records.
 */
export type CompletionStep = { key: string; label: string; done: boolean; weight: number };

export async function caregiverCompletion(caregiverId: string, userId: string) {
  const [caregiver, user, counts] = await Promise.all([
    prisma.caregiverProfile.findUnique({
      where: { id: caregiverId },
      include: {
        categories: true,
        skills: true,
        certifications: true,
        experiences: true,
        availability: true,
        _count: { select: { applications: true, reviews: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, phone: true, phoneVerifiedAt: true, emailVerifiedAt: true },
    }),
    Promise.resolve(null),
  ]);
  void counts;
  if (!caregiver) {
    return { percent: 0, steps: [] as CompletionStep[] };
  }

  const steps: CompletionStep[] = [
    { key: "photo", label: "Add a profile photo", done: Boolean(caregiver.photoUrl || user?.avatarUrl), weight: 10 },
    { key: "headline", label: "Write a headline", done: Boolean(caregiver.headline), weight: 10 },
    { key: "bio", label: "Write an introduction", done: (caregiver.bio?.length ?? 0) > 80, weight: 15 },
    { key: "categories", label: "Choose care categories", done: caregiver.categories.length > 0, weight: 10 },
    { key: "skills", label: "List at least 3 skills", done: caregiver.skills.length >= 3, weight: 10 },
    {
      key: "experience",
      label: "Add work experience",
      done: caregiver.experiences.length > 0 || caregiver.yearsExperience > 0,
      weight: 10,
    },
    {
      key: "availability",
      label: "Set weekly availability",
      done: caregiver.availability.length > 0,
      weight: 10,
    },
    { key: "languages", label: "Add languages", done: csvToList(caregiver.languages).length > 0, weight: 5 },
    {
      key: "certifications",
      label: "Add a certification",
      done: caregiver.certifications.length > 0,
      weight: 10,
    },
    { key: "rate", label: "Set your rate", done: caregiver.hourlyRateCents != null, weight: 5 },
    { key: "email", label: "Verify your email", done: Boolean(user?.emailVerifiedAt), weight: 5 },
  ];

  const totalWeight = steps.reduce((sum, s) => sum + s.weight, 0);
  const earned = steps.filter((s) => s.done).reduce((sum, s) => sum + s.weight, 0);

  return { percent: Math.round((earned / totalWeight) * 100), steps };
}
