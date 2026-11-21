/** Canonical public landing routes for each care category. */

export const CARE_LANDING_ROUTES: Record<string, string> = {
  nanny: "/find-nannies",
  babysitter: "/find-babysitters",
  childcare: "/find-childcare",
  "senior-care": "/find-senior-care",
  "pet-care": "/find-pet-care",
  housekeeping: "/find-housekeeping",
  "special-needs": "/find-special-needs-care",
};

export function careLandingPath(slug: string) {
  return CARE_LANDING_ROUTES[slug] ?? `/search?type=${encodeURIComponent(slug)}`;
}

/** Job landing page for a category, when one exists (used for SEO links). */
export const JOB_LANDING_ROUTES: Record<string, string> = {
  nanny: "/nanny-jobs",
  babysitter: "/babysitting-jobs",
  childcare: "/care-jobs?type=childcare",
  "senior-care": "/care-jobs?type=senior-care",
  "pet-care": "/care-jobs?type=pet-care",
  housekeeping: "/care-jobs?type=housekeeping",
  "special-needs": "/care-jobs?type=special-needs",
};
