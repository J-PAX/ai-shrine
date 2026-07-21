import { getDailyIncense } from "../../../../lib/services/incense";
import { apiErrorResponse, invalidRequest } from "../../../../lib/http/errors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();

    if (!sessionId || sessionId.length > 120) {
      throw invalidRequest("今日香单没有找到参拜印记。");
    }

    return NextResponse.json(await getDailyIncense(sessionId));
  } catch (error) {
    return apiErrorResponse(error, {
      context: "GET /api/incense",
      fallbackMessage: "今日香单还在雾中，请稍后再试。",
    });
  }
}
