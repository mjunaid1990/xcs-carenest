"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ClientApiError } from "@/lib/client";

export function PlatformSettingsForm({
  settings,
}: {
  settings: { key: string; label: string; group: string; type: string; value: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [pending, setPending] = useState(false);

  const groups = Array.from(new Set(settings.map((setting) => setting.group)));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError(undefined); setSuccess(undefined);
    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const setting of settings) values[setting.key] = String(form.get(setting.key) ?? "");
    try {
      await apiRequest("/api/admin/content", { method: "PATCH", body: { resource: "settings", data: { values } } });
      setSuccess("Settings saved.");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {groups.map((group) => (
        <section key={group} className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.filter((setting) => setting.group === group).map((setting) => (
              <label key={setting.key} className="text-xs font-medium">
                {setting.label}
                <span className="ml-1 font-normal text-muted-foreground">({setting.key})</span>
                <Input name={setting.key} defaultValue={setting.value} className="mt-1"
                  type={setting.type === "number" ? "number" : "text"} />
              </label>
            ))}
          </div>
        </section>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
