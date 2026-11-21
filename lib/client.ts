"use client";

/** Typed fetch wrapper for the REST API with field-level error extraction. */
export type ApiFieldErrors = Record<string, string>;

export class ClientApiError extends Error {
  status: number;
  fieldErrors: ApiFieldErrors;
  code: string;

  constructor(message: string, status: number, fieldErrors: ApiFieldErrors = {}, code = "error") {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}

export async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error: string; code?: string; details?: { fieldErrors?: ApiFieldErrors } }
    | null;

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && payload.ok === false ? payload : null;
    throw new ClientApiError(
      error?.error ?? "Request failed. Please try again.",
      response.status,
      error?.details?.fieldErrors ?? {},
      error?.code ?? "error"
    );
  }

  return payload.data;
}

export async function uploadFile(file: File, kind: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const payload = (await response.json().catch(() => null)) as
    | { ok: true; data: { id: string; url: string | null; fileName: string } }
    | { ok: false; error: string }
    | null;
  if (!response.ok || !payload || payload.ok === false) {
    throw new ClientApiError(
      (payload && "error" in payload && payload.error) || "Upload failed.",
      response.status
    );
  }
  return payload.data;
}
