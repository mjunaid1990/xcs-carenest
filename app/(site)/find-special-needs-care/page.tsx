import { CategoryLanding } from "@/components/marketing/category-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Find Special Needs Care",
  description:
    "Find caregivers with training and experience supporting autism, ADHD, sensory needs, physical disabilities and complex medical routines.",
  path: "/find-special-needs-care",
});

export const revalidate = 300;

export default function Page() {
  return <CategoryLanding slug="special-needs" />;
}
