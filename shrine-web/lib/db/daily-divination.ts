import { Prisma } from "@prisma/client";
import { databaseUnavailable } from "../http/errors";
import { getPrisma } from "./client";

export type DailyDivinationGenerationClaim = {
  attemptCount: number;
};

type DailyDivinationSlipInput = {
  fortuneName: string;
  resultText: string;
};

export type DailyDivinationSlipsInput = Record<
  "大吉" | "中吉" | "小吉" | "守",
  DailyDivinationSlipInput
>;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getDailyDivinationSet(dayKey: string) {
  try {
    return await getPrisma().dailyDivinationSet.findUnique({
      where: { dayKey },
    });
  } catch (error) {
    console.error("Daily divination cache read failed.", error);
    throw databaseUnavailable("殿中暂时无法翻开今日签册，请稍后再试。");
  }
}

export async function claimDailyDivinationGeneration(
  dayKey: string,
  leaseToken: string,
  now: Date,
  leaseExpiresAt: Date,
): Promise<DailyDivinationGenerationClaim | null> {
  try {
    try {
      const created = await getPrisma().dailyDivinationSet.create({
        data: {
          dayKey,
          status: "GENERATING",
          leaseToken,
          leaseExpiresAt,
        },
      });

      return { attemptCount: created.attemptCount };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    const claimed = await getPrisma().dailyDivinationSet.updateMany({
      where: {
        dayKey,
        OR: [
          { status: "FAILED", nextRetryAt: null },
          { status: "FAILED", nextRetryAt: { lte: now } },
          { status: "GENERATING", leaseExpiresAt: null },
          { status: "GENERATING", leaseExpiresAt: { lte: now } },
        ],
      },
      data: {
        status: "GENERATING",
        slips: Prisma.DbNull,
        attemptCount: { increment: 1 },
        leaseToken,
        leaseExpiresAt,
        nextRetryAt: null,
        lastErrorCode: null,
        generatedAt: null,
      },
    });

    if (claimed.count !== 1) return null;

    const row = await getPrisma().dailyDivinationSet.findUnique({
      where: { dayKey },
      select: { leaseToken: true, attemptCount: true },
    });

    return row?.leaseToken === leaseToken
      ? { attemptCount: row.attemptCount }
      : null;
  } catch (error) {
    console.error("Daily divination generation claim failed.", error);
    throw databaseUnavailable("殿中暂时无法续写今日签册，请稍后再试。");
  }
}

export async function completeDailyDivinationGeneration(
  dayKey: string,
  leaseToken: string,
  slips: DailyDivinationSlipsInput,
) {
  try {
    const completed = await getPrisma().dailyDivinationSet.updateMany({
      where: {
        dayKey,
        status: "GENERATING",
        leaseToken,
      },
      data: {
        status: "READY",
        slips,
        leaseToken: null,
        leaseExpiresAt: null,
        nextRetryAt: null,
        lastErrorCode: null,
        generatedAt: new Date(),
      },
    });

    if (completed.count !== 1) {
      throw new Error("Daily divination generation lease was lost before completion.");
    }
  } catch (error) {
    console.error("Daily divination cache write failed.", error);
    throw databaseUnavailable("今日签文已经落下，却暂时无法收入签册。请稍后再试。");
  }
}

export async function failDailyDivinationGeneration(
  dayKey: string,
  leaseToken: string,
  errorCode: string,
  nextRetryAt: Date,
) {
  try {
    await getPrisma().dailyDivinationSet.updateMany({
      where: {
        dayKey,
        status: "GENERATING",
        leaseToken,
      },
      data: {
        status: "FAILED",
        slips: Prisma.DbNull,
        leaseToken: null,
        leaseExpiresAt: null,
        nextRetryAt,
        lastErrorCode: errorCode,
        generatedAt: null,
      },
    });
  } catch (error) {
    console.error("Daily divination failure state write failed.", error);
    throw databaseUnavailable("殿中暂时无法整理今日签册，请稍后再试。");
  }
}
