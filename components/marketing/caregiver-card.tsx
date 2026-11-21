import Link from "next/link";
import { MapPin, Clock, Briefcase, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/marketing/rating";
import { VerificationBadges } from "@/components/marketing/verification";
import { availabilitySummary, employmentTypeLabel, rateLabel } from "@/lib/presentation";
import { initials, cn } from "@/lib/utils";
import type { CaregiverCard as CaregiverCardData } from "@/lib/search";

type Props = {
  caregiver: CaregiverCardData;
  view?: "grid" | "list";
  saved?: boolean;
  canSave?: boolean;
  action?: React.ReactNode;
};

export function CaregiverCard({ caregiver, view = "grid", saved, action }: Props) {
  const name = `${caregiver.user.firstName} ${caregiver.user.lastName}`;
  const location = [caregiver.city, caregiver.state].filter(Boolean).join(", ");
  const skills = caregiver.skills.map((s) => s.name);
  const isList = view === "list";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border/70 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift",
        isList && "sm:flex-row sm:items-start sm:gap-5"
      )}
    >
      <div className={cn("flex items-start gap-4", isList && "sm:shrink-0")}>
        <Avatar className="h-16 w-16 rounded-2xl">
          {caregiver.photoUrl ? (
            <AvatarImage src={caregiver.photoUrl} alt={name} className="rounded-2xl" />
          ) : null}
          <AvatarFallback className="rounded-2xl text-lg">
            {initials(caregiver.user.firstName, caregiver.user.lastName)}
          </AvatarFallback>
        </Avatar>
        {!isList ? (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold">
              <Link href={`/caregivers/${caregiver.slug}`} className="hover:text-primary">
                {name}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col", isList ? "mt-3 sm:mt-0" : "mt-3")}>
        {isList ? (
          <div className="mb-2">
            <h3 className="text-base font-semibold">
              <Link href={`/caregivers/${caregiver.slug}`} className="hover:text-primary">
                {name}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </p>
          </div>
        ) : null}

        <Rating value={caregiver.ratingAvg} count={caregiver.ratingCount} />

        {caregiver.headline ? (
          <p className="mt-2 line-clamp-2 text-sm text-ink-500">{caregiver.headline}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline">{rateLabel(caregiver)}</Badge>
          <Badge variant="secondary">{employmentTypeLabel(caregiver.employmentType)}</Badge>
          <Badge variant="secondary">
            <Briefcase className="h-3 w-3" />
            {caregiver.yearsExperience} yr{caregiver.yearsExperience === 1 ? "" : "s"}
          </Badge>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="h-3.5 w-3.5 text-primary" />
          {availabilitySummary(caregiver.availability)}
        </p>

        {skills.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink-500"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-ink-500">
                +{skills.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}

        <VerificationBadges
          size="sm"
          className="mt-3"
          flags={{
            identityVerified: Boolean(caregiver.identityVerifiedAt),
            backgroundChecked: Boolean(caregiver.backgroundCheckAt),
            qualificationsVerified: Boolean(caregiver.qualificationsVerifiedAt),
          }}
          only={["identityVerified", "backgroundChecked", "qualificationsVerified"]}
        />

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/caregivers/${caregiver.slug}`}>View profile</Link>
          </Button>
          {action}
          {saved ? (
            <span className="inline-flex h-8 items-center gap-1 rounded-md bg-primary/10 px-2.5 text-xs font-medium text-primary">
              <Bookmark className="h-3.5 w-3.5 fill-current" /> Saved
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
