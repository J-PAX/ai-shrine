import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.E2E_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("E2E_DATABASE_URL is required. It must use a dedicated schema containing 'e2e'.");
}

const migrationUrl = new URL(databaseUrl);
const schema = migrationUrl.searchParams.get("schema");

if (!schema || !/^[a-zA-Z0-9_]*e2e[a-zA-Z0-9_]*$/i.test(schema) || schema === "public") {
  throw new Error("E2E_DATABASE_URL must include a dedicated non-public schema containing 'e2e'.");
}

const staleSchema = `${schema}_stale`;

if (staleSchema.length > 63) {
  throw new Error("The E2E schema name is too long to create its stale-schema companion.");
}

const connectionUrl = new URL(migrationUrl);
connectionUrl.searchParams.delete("schema");

const client = new pg.Client({ connectionString: connectionUrl.toString() });

try {
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`DROP SCHEMA IF EXISTS "${staleSchema}" CASCADE`);
  await client.query(`CREATE SCHEMA "${staleSchema}"`);
  await client.query(`
    CREATE TABLE "${staleSchema}"."RitualEvent" (
      "id" TEXT PRIMARY KEY,
      "sessionId" TEXT,
      "eventType" TEXT NOT NULL,
      "godName" TEXT,
      "incenseName" TEXT,
      "userMessage" TEXT,
      "resultText" TEXT,
      "dailyKey" TEXT,
      "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    CREATE UNIQUE INDEX "RitualEvent_daily_once_key"
    ON "${staleSchema}"."RitualEvent"("sessionId", "eventType", "dailyKey")
    WHERE "dailyKey" IS NOT NULL
  `);
} finally {
  await client.end();
}

const prismaExecutable = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);

execFileSync(prismaExecutable, ["migrate", "deploy"], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: "inherit",
});
