import Link from "next/link";
import { MapPin } from "lucide-react";

/**
 * Map view. Google Maps Embed API is used when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is
 * configured; otherwise we clearly state that the map is disabled and show a
 * location list instead of pretending to render a map.
 */
export function MapPanel({
  city,
  state,
  results,
}: {
  city?: string;
  state?: string;
  results: { slug: string; name: string; city: string; state: string; rate: string }[];
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = [city, state].filter(Boolean).join(", ") || "United States";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-sand-50">
        {key ? (
          <iframe
            title={`Map of caregivers in ${query}`}
            className="h-[520px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(
              key
            )}&q=${encodeURIComponent(`caregiver near ${query}`)}`}
          />
        ) : (
          <div className="flex h-[520px] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">Map view is not configured</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add <code className="rounded bg-white px-1.5 py-0.5 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
              to .env to enable the interactive map. Until then, use the location list to compare
              candidates by city.
            </p>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border/70 bg-white p-4">
        <p className="text-sm font-semibold">Results by location</p>
        <ul className="mt-3 space-y-2">
          {results.map((result) => (
            <li key={result.slug}>
              <Link
                href={`/caregivers/${result.slug}`}
                className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium">{result.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {result.city}, {result.state}
                  </span>
                </span>
                <span className="whitespace-nowrap text-xs font-semibold text-primary">
                  {result.rate}
                </span>
              </Link>
            </li>
          ))}
          {!results.length ? (
            <li className="px-2 py-6 text-sm text-muted-foreground">No results to place on the map.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
