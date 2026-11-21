import { BadgeCheck, Fingerprint, GraduationCap, Mail, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Verification indicators.
 *
 * A badge is only rendered when the corresponding "verified at" timestamp (or
 * admin-approved verification request) exists in the database. Uploading a
 * document on its own never produces a badge.
 */
export type VerificationFlags = {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  backgroundChecked?: boolean;
  qualificationsVerified?: boolean;
  referencesVerified?: boolean;
};

const CONFIG = {
  identityVerified: {
    label: "ID verified",
    icon: Fingerprint,
    description: "Government-issued ID was checked by our trust & safety team.",
  },
  backgroundChecked: {
    label: "Background check",
    icon: ShieldCheck,
    description: "A background check was completed through our verification partner.",
  },
  qualificationsVerified: {
    label: "Qualifications reviewed",
    icon: GraduationCap,
    description: "Certificates were reviewed and approved by our team.",
  },
  referencesVerified: {
    label: "References checked",
    icon: BadgeCheck,
    description: "References were contacted as part of the verification process.",
  },
  emailVerified: {
    label: "Email verified",
    icon: Mail,
    description: "The account email address was confirmed.",
  },
  phoneVerified: {
    label: "Phone verified",
    icon: Phone,
    description: "The account phone number was confirmed.",
  },
} as const;

type FlagKey = keyof typeof CONFIG;

export function VerificationBadges({
  flags,
  only,
  size = "default",
  className,
}: {
  flags: VerificationFlags;
  only?: FlagKey[];
  size?: "default" | "sm";
  className?: string;
}) {
  const keys = (only ?? (Object.keys(CONFIG) as FlagKey[])).filter((key) => flags[key]);
  if (!keys.length) {
    return (
      <Badge variant="muted" className={className}>
        Verification not started
      </Badge>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {keys.map((key) => {
        const { label, icon: Icon, description } = CONFIG[key];
        return (
          <Badge
            key={key}
            variant={key === "emailVerified" || key === "phoneVerified" ? "muted" : "success"}
            className={cn(size === "sm" && "px-2 py-0 text-[11px]", "cursor-help")}
            title={description}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

/** Honest disclaimer required by the trust & safety brief. */
export function SafetyDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-5 text-muted-foreground", className)}>
      CareNest verifies what it can, but we cannot guarantee any caregiver&apos;s safety or the
      accuracy of every claim. Always interview candidates, check references and follow our
      safety guidance before hiring.
    </p>
  );
}
