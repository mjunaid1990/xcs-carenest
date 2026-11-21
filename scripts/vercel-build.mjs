#!/usr/bin/env node
/**
 * Vercel build pipeline: sync the Prisma schema, seed the database, then build Next.js.
 *
 * Vercel runs this through `vercel-build` (see package.json / vercel.json) instead of
 * `npm run build`, because the deployed database has to exist and be seeded before the
 * first request arrives.
 *
 * The committed schema targets SQLite for zero-setup local development. When the build
 * sees a Postgres DATABASE_URL it generates a temporary schema with `provider = "postgresql"`
 * (prisma/schema.build.prisma) and uses it for generate/push/migrate/seed, so the deployed
 * client talks to Postgres without changing your local development setup.
 *
 * Environment:
 *   DATABASE_URL     required — hosted Postgres (Neon, Supabase, Vercel Postgres, ...)
 *   SEED_ON_BUILD    set to "false" to skip seeding (schema sync still runs)
 *   DIRECT_URL       optional — non-pooled URL used for schema/seed work if set
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

let currentStep = "build";

function run(label, cli, args) {
  currentStep = label;
  console.log(`\n\u25b6 ${label}`);
  execFileSync(process.execPath, [resolve(root, CLI[cli]), ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}

function fail(message) {
  console.error(`\n\u2716 ${currentStep} failed: ${message}\n`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";

if (!databaseUrl) {
  currentStep = "configuration";
  fail(
    "DATABASE_URL is not set. Add your hosted Postgres connection string in Vercel → Settings → Environment Variables (Production, Preview and Development)."
  );
}

if (onVercel && databaseUrl.startsWith("file:")) {
  currentStep = "configuration";
  fail(
    "DATABASE_URL points at local SQLite, which cannot run on Vercel. Create a hosted Postgres database and set the new DATABASE_URL in Vercel."
  );
}

for (const [name, script] of Object.entries(CLI)) {
  if (!existsSync(resolve(root, script))) {
    currentStep = "configuration";
    fail(`missing the ${name} CLI at ${script}. Run npm install before building.`);
  }
}

// Schema and seed work should use the direct (non-pooled) connection when one is provided.
if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;

const isPostgresUrl = /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
const isSqliteUrl = (process.env.DATABASE_URL ?? "").startsWith("file:");

// Align the datasource provider with the URL we were given. The committed schema is SQLite
// for local development; a Postgres deploy needs a Postgres provider.
const sourceSchema = resolve(root, "prisma/schema.prisma");
const schemaText = readFileSync(sourceSchema, "utf8");
const providerMatch = /datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*"(\w+)"/.exec(schemaText);
const schemaProvider = providerMatch?.[1];

if (!schemaProvider) {
  currentStep = "configuration";
  fail("could not read the datasource provider from prisma/schema.prisma.");
}

let schemaPath = sourceSchema;
if (isPostgresUrl && schemaProvider !== "postgresql") {
  const target = resolve(root, "prisma/schema.build.prisma");
  writeFileSync(
    target,
    schemaText.replace(
      /(datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*)"\w+"/,
      (_match, prefix) => `${prefix}"postgresql"`
    )
  );
  schemaPath = target;
  console.log(
    `\n\u25b7 DATABASE_URL is Postgres — building against a generated schema with provider "postgresql".`
  );
} else if (isSqliteUrl && schemaProvider !== "sqlite") {
  const target = resolve(root, "prisma/schema.build.prisma");
  writeFileSync(
    target,
    schemaText.replace(
      /(datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*)"\w+"/,
      (_match, prefix) => `${prefix}"sqlite"`
    )
  );
  schemaPath = target;
  console.log(`\n\u25b7 DATABASE_URL is SQLite — building against a generated "sqlite" schema.`);
}

const schemaArg = `--schema=${schemaPath}`;

try {
  run("Generate the Prisma client", "prisma", ["generate", schemaArg]);

  if (existsSync(resolve(root, "prisma/migrations"))) {
    run("Apply database migrations", "prisma", ["migrate", "deploy", schemaArg]);
  } else {
    run("Sync the database schema", "prisma", ["db", "push", "--skip-generate", schemaArg]);
  }

  if (process.env.SEED_ON_BUILD === "false") {
    console.log("\n\u25b7 SEED_ON_BUILD=false — skipping seed.");
  } else {
    run("Seed the database", "tsx", ["prisma/seed.ts"]);
  }

  run("Build Next.js", "next", ["build"]);
} catch (error) {
  const hints = [];
  if (isPostgresUrl && !process.env.DIRECT_URL) {
    hints.push(
      "If DATABASE_URL is a pooled connection string (Neon/Supabase pgbouncer), also set DIRECT_URL to the non-pooled direct connection — schema changes cannot run through a pooler."
    );
  }
  hints.push(
    "Confirm the database accepts connections from Vercel: the host/port/password in DATABASE_URL are correct, and your provider allows external (non-allowlisted) connections."
  );
  console.error(`\n\u2716 ${currentStep} failed.\n`);
  for (const hint of hints) console.error(`  • ${hint}`);
  if (error?.status !== undefined) console.error(`  • Command exited with status ${error.status}.`);
  console.error("\nSee the command output above for the underlying error.\n");
  rmSync(resolve(root, "prisma/schema.build.prisma"), { force: true });
  process.exit(1);
} finally {
  rmSync(resolve(root, "prisma/schema.build.prisma"), { force: true });
}

console.log("\n\u2714 Build finished.");
