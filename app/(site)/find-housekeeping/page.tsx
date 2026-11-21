import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Housekeeping",
  description:
    "Find reliable housekeepers for weekly cleaning, deep cleans, laundry and home organisation.",
  path: "/find-housekeeping",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="housekeeping" />;
}
