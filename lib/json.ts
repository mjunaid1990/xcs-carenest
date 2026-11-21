import { Prisma } from "@prisma/client";

/**
 * Parse a JSON text column. Every JSON-shaped column in this schema is stored
 * as text so the data model stays portable between SQLite and PostgreSQL.
 */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/** Split a csv column into a trimmed, de-duplicated list. */
export function csvToList(value: string | null | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    )
  );
}

export function listToCsv(value: string[] | undefined | null): string {
  return (value ?? []).map((v) => v.trim()).filter(Boolean).join(",");
}

export function isPrismaUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
