import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Pet Care",
  description:
    "Find pet sitters and dog walkers for daily walks, drop-in visits and overnight stays.",
  path: "/find-pet-care",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="pet-care" />;
}
