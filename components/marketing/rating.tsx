"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            width={size}
            height={size}
            className={cn(
              star <= rounded
                ? "fill-amber-400 text-amber-400"
                : star - 0.5 === rounded
                  ? "fill-amber-200 text-amber-400"
                  : "fill-transparent text-sand-300"
            )}
            aria-hidden
          />
        ))}
      </div>
      {showValue ? (
        <span className="text-xs font-medium text-ink-500">
          {value > 0 ? value.toFixed(1) : "New"}
          {count ? ` (${count})` : ""}
        </span>
      ) : null}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  name = "rating",
}: {
  value: number;
  onChange: (value: number) => void;
  name?: string;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-7 w-7",
              star <= value ? "fill-amber-400 text-amber-400" : "fill-transparent text-sand-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
