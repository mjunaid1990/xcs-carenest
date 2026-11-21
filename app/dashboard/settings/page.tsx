import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { AccountForm } from "./settings-forms";
import { RoleProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [record, family, agency] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { notificationPrefs: true },
    }),
    user.role === "FAMILY" ? prisma.familyProfile.findUnique({ where: { userId: user.id } }) : null,
    user.role === "AGENCY" ? prisma.agencyProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  const prefs = record?.notificationPrefs ?? {
    emailApplications: true, emailMessages: true, emailInterviews: true,
    emailBilling: true, emailReviews: true, emailMarketing: false, inAppEnabled: true,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account settings" description="Your details, notification preferences and password." />

      {user.role === "CAREGIVER" ? (
        <div className="mb-6 rounded-2xl border border-border/70 bg-white p-4 text-sm shadow-soft">
          Your public caregiver profile is edited on the{" "}
          <Link href="/dashboard/caregiver/profile" className="font-semibold text-primary hover:underline">profile page</Link>.
        </div>
      ) : null}

      {user.role === "FAMILY" ? (
        <div className="mb-6">
          <RoleProfileForm
            role="FAMILY"
            initial={{
              headline: family?.headline ?? "",
              about: family?.about ?? "",
              childrenCount: String(family?.childrenCount ?? 0),
              emergencyContact: family?.emergencyContact ?? "",
              city: family?.city ?? user.city ?? "",
              state: family?.state ?? user.state ?? "",
              zip: family?.zip ?? user.zip ?? "",
            }}
          />
        </div>
      ) : null}

      {user.role === "AGENCY" ? (
        <div className="mb-6">
          <RoleProfileForm
            role="AGENCY"
            initial={{
              name: agency?.name ?? "",
              about: agency?.about ?? "",
              website: agency?.website ?? "",
              contactPhone: agency?.contactPhone ?? "",
              contactEmail: agency?.contactEmail ?? "",
              licenseNumber: agency?.licenseNumber ?? "",
              addressLine: agency?.addressLine ?? "",
              city: agency?.city ?? user.city ?? "",
              state: agency?.state ?? user.state ?? "",
              zip: agency?.zip ?? user.zip ?? "",
            }}
          />
        </div>
      ) : null}

      <AccountForm
        account={{
          firstName: record?.firstName ?? user.firstName,
          lastName: record?.lastName ?? user.lastName,
          phone: record?.phone ?? "",
          timezone: record?.timezone ?? "America/New_York",
          city: record?.city ?? "",
          state: record?.state ?? "",
          zip: record?.zip ?? "",
        }}
        prefs={prefs}
      />
    </div>
  );
}
