import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "DAILY_RITUAL_COMPLETED"
  | "DATABASE_UNAVAILABLE"
  | "AI_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function invalidRequest(message: string) {
  return new AppError("INVALID_REQUEST", 400, message);
}

export function dailyRitualCompleted(message: string, resultId?: string) {
  return new AppError(
    "DAILY_RITUAL_COMPLETED",
    409,
    message,
    resultId ? { resultId } : undefined,
  );
}

export function databaseUnavailable(message: string) {
  return new AppError("DATABASE_UNAVAILABLE", 503, message);
}

export function aiUnavailable(message: string) {
  return new AppError("AI_UNAVAILABLE", 503, message);
}

export async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw invalidRequest("殿前小笺的格式无法辨认，请重新提交。");
  }
}

type ErrorResponseOptions = {
  context: string;
  fallbackMessage: string;
};

export function apiErrorResponse(error: unknown, options: ErrorResponseOptions) {
  const requestId = crypto.randomUUID();
  const appError =
    error instanceof AppError
      ? error
      : new AppError("INTERNAL_ERROR", 500, options.fallbackMessage);

  if (appError.status >= 500) {
    console.error(`[${requestId}] ${options.context}`, error);
  }

  return NextResponse.json(
    {
      error: appError.message,
      code: appError.code,
      requestId,
      ...appError.details,
    },
    {
      status: appError.status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
