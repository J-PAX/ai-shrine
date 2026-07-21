import pg from "pg";

function getE2EDatabase() {
  const databaseUrl = process.env.E2E_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("E2E_DATABASE_URL is required for database test helpers.");
  }

  const url = new URL(databaseUrl);
  const schema = url.searchParams.get("schema");

  if (
    !schema ||
    schema === "public" ||
    !/^[a-zA-Z0-9_]*e2e[a-zA-Z0-9_]*$/i.test(schema)
  ) {
    throw new Error("E2E database helpers require a dedicated schema containing 'e2e'.");
  }

  url.searchParams.delete("schema");
  return { connectionString: url.toString(), schema };
}

async function withE2EClient<T>(callback: (client: pg.Client, schema: string) => Promise<T>) {
  const { connectionString, schema } = getE2EDatabase();
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    return await callback(client, schema);
  } finally {
    await client.end();
  }
}

export async function clearDailyDivinationCache() {
  await withE2EClient(async (client, schema) => {
    await client.query(`DELETE FROM "${schema}"."DailyDivinationSet"`);
  });
}

export async function expireDailyDivinationRetry() {
  await withE2EClient(async (client, schema) => {
    await client.query(
      `UPDATE "${schema}"."DailyDivinationSet" SET "nextRetryAt" = NOW() - INTERVAL '1 second'`,
    );
  });
}

export async function getDailyDivinationCacheSnapshot() {
  return withE2EClient(async (client, schema) => {
    const result = await client.query<{
      status: string;
      slips: Record<string, unknown> | null;
      attemptCount: number;
      lastErrorCode: string | null;
    }>(`
      SELECT "status", "slips", "attemptCount", "lastErrorCode"
      FROM "${schema}"."DailyDivinationSet"
    `);

    return result.rows;
  });
}
