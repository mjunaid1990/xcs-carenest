import type { z } from "zod";
import type { searchParamsSchema } from "@/lib/validators";
import type { CaregiverSearchState, JobSearchState } from "@/lib/search";

type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Map validated query-string values onto the query shapes used by lib/search.
 * Kept in one place so every page parses filters identically.
 */
export function searchParamsToState(params: SearchParams): CaregiverSearchState {
  return {
    type: params.type || undefined,
    q: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    zip: params.zip || undefined,
    radius: params.radius,
    minRate: params.minRate,
    maxRate: params.maxRate,
    experience: params.experience,
    availability: params.availability,
    living: params.living,
    verified: params.verified,
    languages: params.languages || undefined,
    certifications: params.certifications || undefined,
    minRating: params.minRating,
    sort: params.sort,
    page: params.page,
    view: params.view,
  };
}

export function jobSearchParamsToState(params: SearchParams): JobSearchState {
  return {
    type: params.type || undefined,
    q: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    page: params.page,
  };
}
