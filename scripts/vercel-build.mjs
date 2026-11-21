#!/usr/bin/env node
/**
 * Vercel build pipeline: sync the Prisma schema, seed the database, then build Next.js.
 *
 * Vercel runs this through `vercel-build` (see package.json / vercel.json) instead of
 * `npm run build`, because the deployed database has to exist and be seeded before the
 * first request arrives.
 *
 * Environment:
 *   DATABASE_URL     required — hosted Postgres (Neon, Supabase, Vercel Postgres, ...)
 *   SEED_ON_BUILD    set to "false" to skip seeding (schema sync still runs)
 *   DIRECT_URL       optional — non-pooled URL used for schema/seed work if set
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const onVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

/** Local CLI entrypoints, run through node so Windows and Linux behave the same. */
const CLI = {
  prisma: "node_modules/prisma/build/index.js",
  next: "node_modules/next/dist/bin/next",
  tsx: "node_modules/tsx/dist/cli.mjs",
};

function step(label, cli, args) {
  const script = CLI[cli];
  console.log(`\n\u25b6 ${label}`);
  execFileSync(process.execPath, [resolve(root, script), ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}

function fail(message) {
  console.error(`\n\u2716 ${message}\n`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";

if (!databaseUrl) {
  fail(
    "DATABASE_URL is not set. Add your hosted Postgres connection string in Vercel → Settings → Environment Variables."
  );
}

if (onVercel && databaseUrl.startsWith("file:")) {
  fail(
    "DATABASE_URL points at local SQLite, which cannot run on Vercel. Create a hosted Postgres database, run `npm run db:use-postgres`, and set the new DATABASE_URL in Vercel."
  );
}

for (const [name, script] of Object.entries(CLI)) {
  if (!existsSync(resolve(root, script))) {
    fail(`Missing ${name} CLI at ${script}. Run npm install before building.`);
  }
}

// Schema and seed work should use the direct (non-pooled) connection when one is provided.
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

step("Generate the Prisma client", "prisma", ["generate"]);

if (existsSync(resolve(root, "prisma/migrations"))) {
  step("Apply database migrations", "prisma", ["migrate", "deploy"]);
} else {
  step("Sync the database schema", "prisma", ["db", "push", "--skip-generate"]);
}

if (process.env.SEED_ON_BUILD === "false") {
  console.log("\n\u25b7 SEED_ON_BUILD=false — skipping seed.");
} else {
  step("Seed the database", "tsx", ["prisma/seed.ts"]);
}

step("Build Next.js", "next", ["build"]);
console.log("\n\u2714 Build finished.");
