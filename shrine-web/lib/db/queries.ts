import { canUseDatabase, getPrisma } from "./client";

export type RitualEventRecord = {
  id: string;
  sessionId: string | null;
  eventType: string;
  godName: string | null;
  userMessage: string | null;
  resultText: string | null;
  createdAt: Date;
};

export type CreateRitualEventInput = {
  sessionId?: string;
  eventType: string;
  godName?: string;
  userMessage?: string;
  resultText?: string;
};

const memoryEvents = new Map<string, RitualEventRecord>();

function getTokyoDayRange(now = new Date()) {
  const tokyoOffsetMs = 9 * 60 * 60 * 1000;
  const tokyoNow = new Date(now.getTime() + tokyoOffsetMs);
  const start = Date.UTC(
    tokyoNow.getUTCFullYear(),
    tokyoNow.getUTCMonth(),
    tokyoNow.getUTCDate(),
  ) - tokyoOffsetMs;

  return {
    start: new Date(start),
    end: new Date(start + 24 * 60 * 60 * 1000),
  };
}

function createMemoryEvent(input: CreateRitualEventInput): RitualEventRecord {
  const event: RitualEventRecord = {
    id: crypto.randomUUID(),
    sessionId: input.sessionId ?? null,
    eventType: input.eventType,
    godName: input.godName ?? null,
    userMessage: input.userMessage ?? null,
    resultText: input.resultText ?? null,
    createdAt: new Date(),
  };

  memoryEvents.set(event.id, event);
  return event;
}

export async function createRitualEvent(input: CreateRitualEventInput) {
  if (!canUseDatabase()) {
    return createMemoryEvent(input);
  }

  try {
    return await getPrisma().ritualEvent.create({
      data: {
        sessionId: input.sessionId,
        eventType: input.eventType,
        godName: input.godName,
        userMessage: input.userMessage,
        resultText: input.resultText,
      },
    });
  } catch (error) {
    console.warn("RitualEvent database write failed; falling back to memory.", error);
    return createMemoryEvent(input);
  }
}

export async function getRitualEventById(id: string) {
  const memoryEvent = memoryEvents.get(id);
  if (memoryEvent) {
    return memoryEvent;
  }

  if (!canUseDatabase()) {
    return null;
  }

  try {
    return await getPrisma().ritualEvent.findUnique({
      where: { id },
    });
  } catch (error) {
    console.warn("RitualEvent database read failed.", error);
    return null;
  }
}

export async function getRitualEventBySessionAndType(sessionId: string, eventType: string) {
  const memoryEvent = Array.from(memoryEvents.values()).find(
    (event) => event.sessionId === sessionId && event.eventType === eventType,
  );

  if (memoryEvent) {
    return memoryEvent;
  }

  if (!canUseDatabase()) {
    return null;
  }

  try {
    return await getPrisma().ritualEvent.findFirst({
      where: { sessionId, eventType },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("RitualEvent lookup failed.", error);
    return null;
  }
}

export async function hasCompletedDailyThanks(sessionId: string, now = new Date()) {
  const { start, end } = getTokyoDayRange(now);

  const memoryMatch = Array.from(memoryEvents.values()).some(
    (event) =>
      event.sessionId === sessionId &&
      event.eventType === "thanks" &&
      event.createdAt >= start &&
      event.createdAt < end,
  );

  if (memoryMatch) {
    return true;
  }

  if (!canUseDatabase()) {
    return false;
  }

  try {
    const count = await getPrisma().ritualEvent.count({
      where: {
        sessionId,
        eventType: "thanks",
        createdAt: { gte: start, lt: end },
      },
    });
    return count > 0;
  } catch (error) {
    console.warn("Daily thanks lookup failed.", error);
    return false;
  }
}
