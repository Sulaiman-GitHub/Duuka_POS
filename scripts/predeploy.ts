// Runs before `next build` (locally and on Vercel):
//   1. generate the Prisma client
//   2. apply pending migrations
//   3. load demo data, but only into an EMPTY database (never overwrites real data)
// With no DATABASE_URL (e.g. a preview build with no database attached) it just generates the client and skips the rest.
import "dotenv/config";
import { execSync } from "node:child_process";
import { databaseUrl } from "../src/lib/db-url";

const run = (cmd: string, env: Record<string, string> = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

run("npx prisma generate");

if (!databaseUrl()) {
  console.log("[predeploy] No database URL is set - skipping migrations and seed.");
} else {
  console.log("[predeploy] Applying migrations...");
  run("npx prisma migrate deploy");
  console.log("[predeploy] Seeding demo data if the database is empty...");
  run("npx tsx prisma/seed.ts", { SEED_IF_EMPTY: "1" });
}
