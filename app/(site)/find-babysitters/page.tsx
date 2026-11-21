import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find a Babysitter",
  description:
    "Find trusted babysitters for evenings, weekends and occasional cover. Compare experience, rates and verified reviews from local families.",
  path: "/find-babysitters",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="babysitter" />;
}
