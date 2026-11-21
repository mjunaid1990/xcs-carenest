import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Childcare",
  description:
    "Search childcare providers for before and after school care, part-time schedules and shared care arrangements.",
  path: "/find-childcare",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="childcare" />;
}
