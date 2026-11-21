import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModerationAction } from "@/components/dashboard/moderation-action";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const { role, q } = await searchParams;

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(role && ["FAMILY", "CAREGIVER", "AGENCY", "ADMIN"].includes(role) ? { role } : {}),
      ...(q
        ? { OR: [{ email: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true,
      status: true, createdAt: true, emailVerifiedAt: true,
    },
  });

  return (
    <div>
      <PageHeader title="Users" description="Search accounts and suspend or reactivate them. Suspension revokes active sessions immediately." />

      <form className="mb-4 flex flex-wrap gap-2" action="/dashboard/admin/users">
        <input name="q" defaultValue={q} placeholder="Search name or email"
          className="h-9 min-w-56 flex-1 rounded-lg border border-input bg-white px-3 text-sm" />
        <select name="role" defaultValue={role ?? ""} className="h-9 rounded-lg border border-input bg-white px-2 text-sm" aria-label="Role">
          <option value="">All roles</option>
          <option value="FAMILY">Families</option>
          <option value="CAREGIVER">Caregivers</option>
          <option value="AGENCY">Agencies</option>
          <option value="ADMIN">Admins</option>
        </select>
        <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-sand-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "ACTIVE" ? "success" : "destructive"}>{user.status.toLowerCase()}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {user.status === "ACTIVE" ? (
                    <ModerationAction type="user" id={user.id} action="suspend" label="Suspend" variant="ghost"
                      confirmText={`Suspend ${user.email}? This signs them out everywhere.`} />
                  ) : (
                    <ModerationAction type="user" id={user.id} action="reactivate" label="Reactivate" variant="outline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length ? <p className="p-6 text-sm text-muted-foreground">No users match that search.</p> : null}
      </div>
    </div>
  );
}
