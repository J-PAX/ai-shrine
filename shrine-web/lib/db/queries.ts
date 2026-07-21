import { Prisma } from "@prisma/client";
import type { RitualType } from "../utils/validator";
import { getTokyoDayKey } from "../utils/time";
import { getPrisma } from "./client";
import { databaseUnavailable } from "../http/errors";

export type RitualEventRecord = {
  id: string;
  sessionId: string | null;
  eventType: string;
  godName: string | null;
  incenseName: string | null;
  userMessage: string | null;
  resultText: string | null;
  dailyKey: string | null;
  createdAt: Date;
};

export type CreateRitualEventInput = {
  sessionId?: string;
  eventType: string;
  godName?: string;
  incenseName?: string;
  userMessage?: string;
  resultText?: string;
  dailyKey?: string;
};

export class DailyRitualAlreadyCompletedError extends Error {
  constructor() {
    super("Daily ritual already completed.");
    this.name = "DailyRitualAlreadyCompletedError";
  }
}

export async function createRitualEvent(input: CreateRitualEventInput) {
  try {
    return await getPrisma().ritualEvent.create({
      data: {
        sessionId: input.sessionId,
        eventType: input.eventType,
        godName: input.godName,
        incenseName: input.incenseName,
        userMessage: input.userMessage,
        resultText: input.resultText,
        dailyKey: input.dailyKey,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DailyRitualAlreadyCompletedError();
    }

    console.error("RitualEvent database write failed.", error);
    throw databaseUnavailable("殿中暂时无法安放这次仪式，请稍后再试。");
  }
}

export async function getRitualEventById(id: string) {
  try {
    return await getPrisma().ritualEvent.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("RitualEvent database read failed.", error);
    throw databaseUnavailable("殿中暂时无法寻回这枚回音，请稍后再试。");
  }
}

export async function getRitualEventBySessionAndType(sessionId: string, eventType: string) {
  try {
    return await getPrisma().ritualEvent.findFirst({
      where: { sessionId, eventType },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("RitualEvent lookup failed.", error);
    throw databaseUnavailable("殿中暂时无法读取今日记录，请稍后再试。");
  }
}

export async function hasCompletedDailyRitual(
  sessionId: string,
  ritualType: RitualType,
  now = new Date(),
) {
  return Boolean(await getDailyRitualEvent(sessionId, ritualType, getTokyoDayKey(now)));
}

export async function getDailyRitualEvent(
  sessionId: string,
  ritualType: RitualType,
  dayKey = getTokyoDayKey(),
) {
  try {
    return await getPrisma().ritualEvent.findFirst({
      where: {
        sessionId,
        eventType: ritualType,
        dailyKey: dayKey,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Daily ritual lookup failed.", error);
    throw databaseUnavailable("殿中暂时无法确认今日参拜记录，请稍后再试。");
  }
}
