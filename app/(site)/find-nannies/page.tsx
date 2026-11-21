import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find a Nanny",
  description:
    "Browse experienced nannies for full-time and part-time in-home childcare. Compare rates, availability, certifications and verified reviews.",
  path: "/find-nannies",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="nanny" />;
}
