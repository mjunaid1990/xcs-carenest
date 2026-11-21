"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ClientApiError } from "@/lib/client";

export type ContentField = {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "checkbox";
  value: string | number | boolean | null;
};

export function ContentEditor({
  resource,
  id,
  fields,
}: {
  resource: "cms" | "blog";
  id: string;
  fields: ContentField[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form.get(field.name);
      if (field.kind === "checkbox") data[field.name] = raw === "on";
      else if (field.kind === "number") data[field.name] = Number(raw ?? 0);
      else data[field.name] = String(raw ?? "");
    }
    try {
      await apiRequest("/api/admin/content", { method: "PATCH", body: { resource, id, data } });
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Edit</Button>;

  return (
    <form onSubmit={save} className="mt-2 grid gap-2 rounded-xl border border-border bg-sand-50 p-3">
      {fields.map((field) => (
        <label key={field.name} className="text-xs font-medium">
          {field.label}
          {field.kind === "textarea" ? (
            <textarea name={field.name} rows={field.name === "body" ? 10 : 3} defaultValue={String(field.value ?? "")}
              className="mt-1 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm" />
          ) : field.kind === "checkbox" ? (
            <input type="checkbox" name={field.name} defaultChecked={Boolean(field.value)} className="ml-2 align-middle" />
          ) : (
            <Input name={field.name} type={field.kind === "number" ? "number" : "text"} defaultValue={String(field.value ?? "")} className="mt-1" />
          )}
        </label>
      ))}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
