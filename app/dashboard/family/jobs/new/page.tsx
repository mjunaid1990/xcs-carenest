import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { JobForm } from "./job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireRole("FAMILY", "AGENCY", "ADMIN");
  const categories = await prisma.careCategory.findMany({
    where: { isActive: true, isCareType: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Post a care job" description="Clear job posts get better applicants. You can publish now or save a draft." />
      <JobForm categories={categories} />
    </div>
  );
}
