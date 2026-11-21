import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caregiverCardInclude } from "@/lib/search";
import { PageHeader } from "@/components/dashboard/page-header";
import { CaregiverCard } from "@/components/marketing/caregiver-card";
import { JobCard } from "@/components/marketing/job-card";
import { SaveButton } from "@/components/marketplace/save-button";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser();
  const [caregivers, jobs] = await Promise.all([
    prisma.savedCaregiver.findMany({
      where: { userId: user.id, caregiver: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: { caregiver: { include: caregiverCardInclude } },
    }),
    prisma.savedJob.findMany({
      where: { userId: user.id, job: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            category: { select: { name: true, singular: true } },
            owner: { select: { firstName: true, lastName: true } },
            agency: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Saved"
        description="Profiles and jobs you bookmarked. Saved items stay here until you remove them."
        action={{ href: user.role === "CAREGIVER" ? "/care-jobs" : "/search", label: user.role === "CAREGIVER" ? "Find jobs" : "Find caregivers" }}
      />

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold">Saved caregivers ({caregivers.length})</h2>
        {caregivers.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map(({ caregiver }) => (
              <CaregiverCard
                key={caregiver.id}
                caregiver={caregiver}
                action={<SaveButton kind="caregiver" id={caregiver.id} initialSaved isAuthenticated compact />}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved caregivers"
            description="Use the save button on any caregiver profile to keep it here."
            action={{ href: "/search", label: "Browse caregivers" }}
            icon="search"
          />
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Saved jobs ({jobs.length})</h2>
        {jobs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map(({ job }) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved jobs"
            description="Save interesting roles while you browse and come back to them later."
            action={{ href: "/care-jobs", label: "Browse care jobs" }}
            icon="search"
          />
        )}
      </section>
    </div>
  );
}
