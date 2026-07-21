import { NextResponse } from "next/server";
import { completeRitual } from "../../../../lib/services/ritual";
import { parseRitualRequest } from "../../../../lib/utils/validator";
import {
  apiErrorResponse,
  invalidRequest,
  readJsonBody,
} from "../../../../lib/http/errors";

export async function POST(request: Request) {
  try {
    const input = parseRitualRequest(await readJsonBody(request));

    if (input.ritualType !== "divination" || !input.sessionId) {
      throw invalidRequest("这条签路需要一枚本地参拜印记。");
    }

    return NextResponse.json(await completeRitual(input), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "POST /api/oracle",
      fallbackMessage: "神前回音暂时没有落下。",
    });
  }
}
