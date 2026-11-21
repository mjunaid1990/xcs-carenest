import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlatformSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const settings = await prisma.platformSetting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Platform settings"
        description="Operational values such as fees, limits and trust rules. Stored in the database and read at runtime."
      />
      {settings.length ? (
        <PlatformSettingsForm
          settings={settings.map((setting) => ({
            key: setting.key,
            label: setting.label ?? setting.key,
            group: setting.group,
            type: setting.type,
            value: setting.value,
          }))}
        />
      ) : (
        <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          No settings yet — run the seed script to create the defaults.
        </p>
      )}
    </div>
  );
}
