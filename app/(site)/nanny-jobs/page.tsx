import { CategoryJobsLanding } from "@/components/marketing/category-jobs-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Nanny Jobs",
  description:
    "Browse full-time and part-time nanny jobs. See rates, schedules and requirements, then apply with your CareNest profile.",
  path: "/nanny-jobs",
});

export const revalidate = 300;

export default function Page() {
  return (
    <CategoryJobsLanding
      categorySlug="nanny"
      title="Nanny jobs"
      description="Full-time, part-time and live-in nanny roles posted by families and agencies. Every listing shows the schedule, budget and requirements up front."
      path="/nanny-jobs"
    />
  );
}
