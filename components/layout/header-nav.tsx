"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  User,
  X,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import { ROLE_HOME, ROLE_LABELS, type Role } from "@/lib/rbac";
import { careLandingPath } from "@/lib/category-routes";

export type HeaderCategory = { slug: string; name: string; shortName: string | null };

export type HeaderUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  unreadMessages: number;
  unreadNotifications: number;
} | null;

const NAV = [
  { href: "/care-jobs", label: "Find Jobs" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/safety", label: "Safety" },
];

export function HeaderNav({
  user,
  categories,
}: {
  user: HeaderUser;
  categories: HeaderCategory[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-muted">
                  Find Care <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Browse care categories</DropdownMenuLabel>
                {categories.map((category) => (
                  <DropdownMenuItem key={category.slug} asChild>
                    <Link href={careLandingPath(category.slug)}>
                      <Heart className="h-4 w-4 text-primary" />
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/search">
                    <Search className="h-4 w-4" /> Search all caregivers
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  pathname.startsWith(item.href) ? "text-primary" : "text-ink-700"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Messages" className="relative">
                <Link href="/dashboard/messages">
                  <MessageSquare className="h-5 w-5" />
                  {user.unreadMessages > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                      {user.unreadMessages > 9 ? "9+" : user.unreadMessages}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5" />
                  {user.unreadNotifications > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-foreground px-1 text-[10px] font-bold text-white">
                      {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-muted">
                    <Avatar className="h-7 w-7">
                      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="text-[11px]">
                        {initials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.firstName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user.firstName} {user.lastName}
                    <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-muted-foreground">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROLE_HOME[user.role]}>
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <User className="h-4 w-4" /> Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/auth/logout" method="post" className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2 text-left">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Join now</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page space-y-1 py-4">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Find care
            </p>
            <div className="grid grid-cols-2 gap-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={careLandingPath(category.slug)}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <div className="my-2 h-px bg-border" />
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid gap-2 pt-3">
              {user ? (
                <>
                  <Button asChild>
                    <Link href={ROLE_HOME[user.role]} onClick={() => setMobileOpen(false)}>
                      Go to dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/messages" onClick={() => setMobileOpen(false)}>
                      Messages {user.unreadMessages > 0 ? `(${user.unreadMessages})` : ""}
                    </Link>
                  </Button>
                  <form action="/api/auth/logout" method="post">
                    <Button type="submit" variant="ghost" className="w-full">
                      Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Join now
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
