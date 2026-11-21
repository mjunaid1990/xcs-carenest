import Link from "next/link";
import {
  Accessibility,
  Baby,
  Heart,
  HeartHandshake,
  PawPrint,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { careLandingPath } from "@/lib/category-routes";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Heart,
  Baby,
  Users,
  HeartHandshake,
  PawPrint,
  Sparkles,
  Accessibility,
};

type Category = {
  id: string;
  slug: string;
  name: string;
  singular: string;
  description: string;
  icon: string;
  caregiverCount?: number;
};

export function CategoryGrid({
  categories,
  className,
}: {
  categories: Category[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {categories.map((category, index) => {
        const Icon = ICONS[category.icon] ?? Heart;
        return (
          <Link
            key={category.id}
            href={careLandingPath(category.slug)}
            className={cn(
              "group relative flex flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift",
              index === 0 && "sm:col-span-2 lg:col-span-1"
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold">{category.name}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-muted-foreground">
              {category.description}
            </p>
            <span className="mt-auto pt-3 text-xs font-semibold text-primary">
              {category.caregiverCount != null
                ? `${category.caregiverCount} caregiver${category.caregiverCount === 1 ? "" : "s"}`
                : `Find a ${category.singular.toLowerCase()}`}{" "}
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
