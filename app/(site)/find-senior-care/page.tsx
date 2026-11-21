import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Senior Care",
  description:
    "Find senior caregivers for companionship, personal care, dementia support and daily living assistance.",
  path: "/find-senior-care",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="senior-care" />;
}
