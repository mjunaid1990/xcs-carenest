"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Bookmark, Briefcase, CalendarClock, CreditCard, FileBadge, Heart, LayoutDashboard,
  LogOut, Menu, MessageSquare, Settings, ShieldCheck, UserRound, Users, X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/rbac";

const ICONS = {
  dashboard: LayoutDashboard, jobs: Briefcase, saved: Bookmark, messages: MessageSquare,
  interviews: CalendarClock, reviews: Heart, subscription: CreditCard, settings: Settings,
  profile: UserRound, verification: ShieldCheck, users: Users, notifications: Bell,
  applications: FileBadge,
};

type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const NAV: Record<Role, NavItem[]> = {
  FAMILY: [
    { href: "/dashboard/family", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/family/jobs", label: "My jobs", icon: "jobs" },
    { href: "/dashboard/family/reviews", label: "Reviews", icon: "reviews" },
    { href: "/dashboard/saved", label: "Saved", icon: "saved" },
    { href: "/dashboard/messages", label: "Messages", icon: "messages" },
    { href: "/dashboard/interviews", label: "Interviews", icon: "interviews" },
    { href: "/dashboard/subscription", label: "Subscription", icon: "subscription" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
  CAREGIVER: [
    { href: "/dashboard/caregiver", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/caregiver/applications", label: "Applications", icon: "applications" },
    { href: "/dashboard/caregiver/profile", label: "My profile", icon: "profile" },
    { href: "/dashboard/verification", label: "Verification", icon: "verification" },
    { href: "/dashboard/saved", label: "Saved jobs", icon: "saved" },
    { href: "/dashboard/messages", label: "Messages", icon: "messages" },
    { href: "/dashboard/interviews", label: "Interviews", icon: "interviews" },
    { href: "/dashboard/subscription", label: "Subscription", icon: "subscription" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
  AGENCY: [
    { href: "/dashboard/agency", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/agency/jobs", label: "Jobs", icon: "jobs" },
    { href: "/dashboard/agency/caregivers", label: "Caregivers", icon: "users" },
    { href: "/dashboard/messages", label: "Messages", icon: "messages" },
    { href: "/dashboard/interviews", label: "Interviews", icon: "interviews" },
    { href: "/dashboard/subscription", label: "Subscription", icon: "subscription" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/admin/users", label: "Users", icon: "users" },
    { href: "/dashboard/admin/verifications", label: "Verifications", icon: "verification" },
    { href: "/dashboard/admin/reports", label: "Reports", icon: "notifications" },
    { href: "/dashboard/admin/reviews", label: "Reviews", icon: "reviews" },
    { href: "/dashboard/admin/jobs", label: "Jobs", icon: "jobs" },
    { href: "/dashboard/admin/plans", label: "Plans", icon: "subscription" },
    { href: "/dashboard/admin/content", label: "Content", icon: "profile" },
    { href: "/dashboard/admin/settings", label: "Settings", icon: "settings" },
  ],
};

export function DashboardShell({
  user, unreadNotifications, unreadMessages, children,
}: {
  user: { firstName: string; lastName: string; email: string; role: Role; avatarUrl: string | null };
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV[user.role];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4"><Logo /></div>
      <div className="border-y border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-[11px]">{initials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.firstName} {user.lastName}</p>
            <Badge variant="default" className="mt-0.5 px-1.5 py-0 text-[10px]">{ROLE_LABELS[user.role]}</Badge>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Dashboard">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-ink-700 hover:bg-muted")}>
              <Icon className="h-4 w-4" />{item.label}
              {item.href === "/dashboard/messages" && unreadMessages > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{unreadMessages}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-2">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-muted">Back to site</Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sand-50/50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/70 bg-white lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-lift">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" aria-label="Open dashboard menu" onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="hidden text-sm text-muted-foreground sm:block">
            Signed in as <span className="font-medium text-ink-900">{user.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/messages" className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted" aria-label="Messages">
              <MessageSquare className="h-4 w-4" />
              {unreadMessages > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" /> : null}
            </Link>
            <Link href="/dashboard/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-foreground" /> : null}
            </Link>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
