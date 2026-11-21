import Link from "next/link";
import { Briefcase, CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { budgetLabel, employmentTypeLabel, livingLabel } from "@/lib/presentation";
import { cn, formatDate, timeAgo } from "@/lib/utils";

export type JobCardData = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  budgetType: string;
  budgetMinCents: number;
  budgetMaxCents: number | null;
  employmentType: string;
  livingArrangement: string;
  schedule: string;
  startDate: Date | null;
  createdAt: Date;
  applicationCount?: number;
  isFeatured?: boolean;
  category?: { name: string; singular: string } | null;
  agency?: { name: string } | null;
  owner?: { firstName: string; lastName: string } | null;
};

export function JobCard({ job, className }: { job: JobCardData; className?: string }) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">{job.category?.name ?? "Care job"}</p>
          <h3 className="mt-1 text-base font-semibold leading-snug">
            <Link href={`/care-jobs/${job.slug}`} className="hover:text-primary">
              {job.title}
            </Link>
          </h3>
        </div>
        <span className="whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {budgetLabel(job)}
        </span>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {job.city}, {job.state}
        {job.isFeatured ? (
          <Badge variant="warning" className="ml-1 py-0 text-[10px]">
            Featured
          </Badge>
        ) : null}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          <Briefcase className="h-3 w-3" /> {employmentTypeLabel(job.employmentType)}
        </Badge>
        <Badge variant="secondary">{livingLabel(job.livingArrangement)}</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-ink-500">{job.schedule}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {job.startDate ? (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Starts {formatDate(job.startDate)}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {job.applicationCount ?? 0} applicant
          {(job.applicationCount ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-[11px] text-muted-foreground">
          Posted {timeAgo(job.createdAt)}
          {job.agency?.name ? ` · ${job.agency.name}` : ""}
        </span>
        <Link
          href={`/care-jobs/${job.slug}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View job →
        </Link>
      </div>
    </article>
  );
}
