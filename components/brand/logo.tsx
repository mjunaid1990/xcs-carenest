import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original CareNest wordmark: a nest/heart glyph plus the word mark. */
export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="CareNest home"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="40" height="40" rx="12" fill="hsl(var(--primary))" />
        <path
          d="M20 27.5c-4.2-2.7-7-5.4-7-8.6 0-2.3 1.8-4.1 4-4.1 1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.1 0 3.2-2.8 5.9-7 8.6Z"
          fill="#fff"
        />
        <path
          d="M12.5 29.2c2.6 1.5 5.1 2.2 7.5 2.2s4.9-.7 7.5-2.2"
          stroke="#F6D9B8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact ? (
        <span className="text-[1.35rem] font-semibold tracking-[-0.03em] text-ink-900">
          Care<span className="text-primary">Nest</span>
        </span>
      ) : null}
    </Link>
  );
}
