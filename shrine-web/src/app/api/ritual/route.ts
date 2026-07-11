import { NextResponse } from "next/server";
import { completeRitual, getDailyThanksStatus } from "../../../../lib/services/ritual";
import { parseRitualRequest } from "../../../../lib/utils/validator";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "参拜印记缺失。" }, { status: 400 });
  }

  return NextResponse.json(await getDailyThanksStatus(sessionId));
}

export async function POST(request: Request) {
  try {
    const input = parseRitualRequest(await request.json());
    const result = await completeRitual(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "殿门刚刚晃了一下，请稍后再试。";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }
}
