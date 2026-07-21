import { NextResponse } from "next/server";
import {
  canUseDatabase,
  checkDatabaseConnection,
  DatabaseSchemaNotReadyError,
} from "../../../../lib/db/client";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);

  if (!canUseDatabase()) {
    return NextResponse.json(
      {
        ok: false,
        status: "not_ready",
        service: "ai-shrine",
        database: { status: "down", reason: "not_configured" },
        openai: { configured: openAIConfigured },
        checkedAt,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { latencyMs } = await checkDatabaseConnection();
    const ready = openAIConfigured;

    return NextResponse.json(
      {
        ok: ready,
        status: ready ? "ready" : "not_ready",
        service: "ai-shrine",
        database: { status: "up", latencyMs },
        openai: {
          configured: openAIConfigured,
          ...(ready ? {} : { reason: "not_configured" }),
        },
        checkedAt,
      },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Database health check failed.", error);
    const reason =
      error instanceof DatabaseSchemaNotReadyError ? "migration_required" : "unreachable";

    return NextResponse.json(
      {
        ok: false,
        status: "not_ready",
        service: "ai-shrine",
        database: {
          status: reason === "migration_required" ? "not_ready" : "down",
          reason,
        },
        openai: { configured: openAIConfigured },
        checkedAt,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
