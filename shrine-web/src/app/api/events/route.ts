import { NextResponse } from "next/server";
import { trackTempleEvent } from "../../../../lib/services/tracking";
import {
  apiErrorResponse,
  invalidRequest,
  readJsonBody,
} from "../../../../lib/http/errors";

const allowedEventTypes = new Set(["temple_entry", "share_opened"]);

export async function POST(request: Request) {
  try {
    const value = await readJsonBody(request);
    const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;

    if (
      !allowedEventTypes.has(eventType) ||
      eventType.length > 80 ||
      (sessionId && sessionId.length > 120)
    ) {
      throw invalidRequest("这枚殿前脚印的内容无法辨认。");
    }

    const event = await trackTempleEvent(eventType, sessionId);

    return NextResponse.json({ id: event.id, ok: true }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "POST /api/events",
      fallbackMessage: "这枚脚印没有留住，请稍后再试。",
    });
  }
}
