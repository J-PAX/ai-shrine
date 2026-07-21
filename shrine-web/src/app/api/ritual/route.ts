import { NextResponse } from "next/server";
import { completeRitual, getDailyRitualStatus } from "../../../../lib/services/ritual";
import { isRitualType, parseRitualRequest } from "../../../../lib/utils/validator";
import {
  apiErrorResponse,
  invalidRequest,
  readJsonBody,
} from "../../../../lib/http/errors";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const sessionId = searchParams.get("sessionId")?.trim();
    const ritualType = searchParams.get("ritualType")?.trim();

    if (!sessionId || sessionId.length > 120 || !isRitualType(ritualType)) {
      throw invalidRequest("参拜状态无法确认。");
    }

    return NextResponse.json(await getDailyRitualStatus(sessionId, ritualType));
  } catch (error) {
    return apiErrorResponse(error, {
      context: "GET /api/ritual",
      fallbackMessage: "参拜状态暂时无法确认。",
    });
  }
}

export async function POST(request: Request) {
  try {
    const input = parseRitualRequest(await readJsonBody(request));
    const result = await completeRitual(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "POST /api/ritual",
      fallbackMessage: "殿门刚刚晃了一下，请稍后再试。",
    });
  }
}
