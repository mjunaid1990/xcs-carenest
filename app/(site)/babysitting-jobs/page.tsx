import { CategoryJobsLanding } from "@/components/marketing/category-jobs-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Babysitting Jobs",
  description:
    "Find babysitting jobs for evenings, weekends and occasional cover. Apply directly with your CareNest profile.",
  path: "/babysitting-jobs",
});

export const revalidate = 300;

export default function Page() {
  return (
    <CategoryJobsLanding
      categorySlug="babysitter"
      title="Babysitting jobs"
      description="Occasional, evening and weekend babysitting roles. Most are local, part-time and start quickly."
      path="/babysitting-jobs"
    />
  );
}
