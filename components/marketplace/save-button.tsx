"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiRequest, ClientApiError } from "@/lib/client";
import { cn } from "@/lib/utils";

export function SaveButton({
  kind,
  id,
  initialSaved,
  isAuthenticated,
  className,
  compact,
}: {
  kind: "caregiver" | "job";
  id: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const endpoint =
      kind === "caregiver" ? "/api/saved/caregivers" : "/api/saved/jobs";
    try {
      const result = await apiRequest<{ saved: boolean }>(endpoint, {
        method: "POST",
        body: { id },
      });
      setSaved(result.saved);
      toast.success(result.saved ? "Saved to your list" : "Removed from saved");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof ClientApiError ? error.message : "Could not update your saved list.");
    }
  }

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size={compact ? "sm" : "default"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(saved && "text-primary", className)}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {compact ? <span className="sr-only">{saved ? "Remove from saved" : "Save"}</span> : saved ? "Saved" : "Save"}
    </Button>
  );
}
