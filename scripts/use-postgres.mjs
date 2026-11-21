/**
 * Switch the Prisma datasource to PostgreSQL.
 *
 *   node scripts/use-postgres.mjs
 *
 * The schema is intentionally provider-neutral (String status columns, integer
 * money, text JSON) so switching engines only changes the datasource block.
 * After running this, set DATABASE_URL to your PostgreSQL connection string and
 * create the schema with `npx prisma migrate dev` (development) or
 * `npx prisma migrate deploy` (production).
 */
import fs from "node:fs/promises";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

const source = await fs.readFile(schemaPath, "utf8");
const updated = source.replace(
  /datasource db \{\s*provider = "sqlite"\s*url\s*= env\("DATABASE_URL"\)\s*\}/,
  'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}'
);

if (updated === source) {
  console.log('Prisma is already configured for PostgreSQL (or the datasource block did not match).');
} else {
  await fs.writeFile(schemaPath, updated, "utf8");
  console.log("prisma/schema.prisma now uses PostgreSQL.");
}

console.log(`
Next steps:
  1. Set DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/carenest?schema=public" in .env
  2. Generate an initial migration:  npx prisma migrate dev --name init
     (For an existing database:      npx prisma migrate deploy)
  3. Seed:                           npm run db:seed
  4. Build and start:                npm run build && npm start
`);
