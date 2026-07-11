import { NextResponse } from "next/server";
import { getDailyIncense } from "../../../../lib/services/incense";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();

  if (!sessionId || sessionId.length > 120) {
    return NextResponse.json({ error: "今日香单没有找到参拜印记。" }, { status: 400 });
  }

  return NextResponse.json(await getDailyIncense(sessionId));
}
