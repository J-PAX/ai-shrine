import { invalidRequest } from "../http/errors";

export type RitualType = "thanks" | "divination";

export type RitualRequestInput = {
  ritualType: RitualType;
  userMessage?: string;
  sessionId?: string;
  incenseName?: string;
};

export function isRitualType(value: unknown): value is RitualType {
  return value === "thanks" || value === "divination";
}

export function parseRitualRequest(value: unknown): RitualRequestInput {
  if (!value || typeof value !== "object") {
    throw invalidRequest("请以轻声入殿：仪式内容缺失。");
  }

  const body = value as Record<string, unknown>;

  if (!isRitualType(body.ritualType)) {
    throw invalidRequest("这条仪式路径尚未开放。");
  }

  const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : undefined;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : undefined;
  const incenseName = typeof body.incenseName === "string" ? body.incenseName.trim() : undefined;

  if (userMessage && userMessage.length > 240) {
    throw invalidRequest("神前小笺请短一点，240 字以内就够了。");
  }

  if (sessionId && sessionId.length > 120) {
    throw invalidRequest("这枚参拜印记太长了，请刷新页面后再试。");
  }

  if (incenseName && incenseName.length > 12) {
    throw invalidRequest("这缕香名似乎不属于今日香单。");
  }

  return {
    ritualType: body.ritualType,
    userMessage,
    sessionId,
    incenseName,
  };
}
