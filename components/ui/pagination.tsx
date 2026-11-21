"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** SEO-friendly pagination that preserves existing query parameters. */
export function Pagination({
  page,
  pageCount,
  className,
}: {
  page: number;
  pageCount: number;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm",
          page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
        )}
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Link>
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && p - pages[index - 1]! > 1 ? (
            <span className="px-1 text-muted-foreground">…</span>
          ) : null}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm",
              p === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= pageCount}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm",
          page >= pageCount ? "pointer-events-none opacity-40" : "hover:bg-muted"
        )}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
