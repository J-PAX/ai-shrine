import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseUnavailable } from "../http/errors";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export class DatabaseSchemaNotReadyError extends Error {
  constructor() {
    super("Database schema is missing required migrations.");
    this.name = "DatabaseSchemaNotReadyError";
  }
}

function createPostgresAdapter(connectionString: string) {
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? undefined;
  url.searchParams.delete("schema");

  return new PrismaPg(
    {
      connectionString: url.toString(),
      connectionTimeoutMillis: 2_000,
      query_timeout: 2_000,
      statement_timeout: 2_000,
    },
    schema ? { schema } : undefined,
  );
}

export function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw databaseUnavailable("殿中暂时无法连接记录之册，请稍后再试。");
  }

  if (!globalForPrisma.prisma) {
    let adapter: PrismaPg;

    try {
      adapter = createPostgresAdapter(connectionString);
    } catch (error) {
      console.error("PostgreSQL adapter configuration failed.", error);
      throw databaseUnavailable("殿中暂时无法连接记录之册，请稍后再试。");
    }

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}

export async function checkDatabaseConnection(timeoutMs = 2_000) {
  const startedAt = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const schema = databaseUrl.searchParams.get("schema") ?? "public";

  try {
    const rows = await Promise.race([
      getPrisma().$queryRaw<
        Array<{
          requiredColumnCount: number;
          createdAtType: string | null;
          dailyIndexPresent: boolean;
          divinationCacheColumnCount: number;
          divinationCachePrimaryKeyPresent: boolean;
        }>
      >`
        SELECT
          (
            SELECT COUNT(*)::integer
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = 'RitualEvent'
              AND column_name IN ('incenseName', 'dailyKey', 'createdAt')
          ) AS "requiredColumnCount",
          (
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = 'RitualEvent'
              AND column_name = 'createdAt'
          ) AS "createdAtType",
          EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = ${schema}
              AND tablename = 'RitualEvent'
              AND indexname = 'RitualEvent_daily_once_key'
          ) AS "dailyIndexPresent",
          (
            SELECT COUNT(*)::integer
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = 'DailyDivinationSet'
              AND column_name IN (
                'dayKey',
                'status',
                'slips',
                'attemptCount',
                'leaseToken',
                'leaseExpiresAt',
                'nextRetryAt',
                'lastErrorCode',
                'generatedAt',
                'createdAt',
                'updatedAt'
              )
          ) AS "divinationCacheColumnCount",
          EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = ${schema}
              AND tablename = 'DailyDivinationSet'
              AND indexname = 'DailyDivinationSet_pkey'
          ) AS "divinationCachePrimaryKeyPresent"
      `,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Database health check timed out.")), timeoutMs);
      }),
    ]);

    const schemaState = rows[0];

    if (
      !schemaState ||
      schemaState.requiredColumnCount !== 3 ||
      schemaState.createdAtType !== "timestamp with time zone" ||
      !schemaState.dailyIndexPresent ||
      schemaState.divinationCacheColumnCount !== 11 ||
      !schemaState.divinationCachePrimaryKeyPresent
    ) {
      throw new DatabaseSchemaNotReadyError();
    }

    return { latencyMs: Date.now() - startedAt };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
