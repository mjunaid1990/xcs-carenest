import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { rateLabel } from "@/lib/presentation";

export const dynamic = "force-dynamic";

export default async function AgencyCaregiversPage() {
  const user = await requireRole("AGENCY");
  const agency = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });
  const caregivers = agency
    ? await prisma.caregiverProfile.findMany({
        where: { agencyId: agency.id, deletedAt: null },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Agency caregivers"
        description="Caregivers linked to your agency. They can be assigned to your job posts."
      />
      {!agency ? (
        <EmptyState title="Agency profile required" description="Add your agency details in settings first." action={{ href: "/dashboard/settings", label: "Open settings" }} />
      ) : !caregivers.length ? (
        <EmptyState
          title="No caregivers linked yet"
          description="Caregivers who join through your agency will appear here. Profiles are linked by our team or during onboarding."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {caregivers.map((caregiver) => (
            <Link key={caregiver.id} href={`/caregivers/${caregiver.slug}`}
              className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft hover:border-primary/40">
              <p className="text-sm font-semibold">{caregiver.user.firstName} {caregiver.user.lastName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{caregiver.headline ?? "Caregiver"}</p>
              <p className="mt-2 text-xs text-ink-500">
                {caregiver.city}, {caregiver.state} · {rateLabel(caregiver)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
