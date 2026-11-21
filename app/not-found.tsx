import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 px-6 text-center">
      <Logo />
      <p className="mt-10 flex items-center gap-2 text-sm font-semibold text-primary">
        <Compass className="h-4 w-4" /> 404 — page not found
      </p>
      <h1 className="display mt-3 max-w-xl text-3xl leading-tight sm:text-4xl">
        We could not find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-ink-500">
        The link may be broken, or the profile or job may no longer be published. Try searching
        instead.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/"><Home className="h-4 w-4" /> Back home</Link></Button>
        <Button asChild variant="outline"><Link href="/search"><Search className="h-4 w-4" /> Search caregivers</Link></Button>
      </div>
    </div>
  );
}
