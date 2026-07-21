export function getTokyoDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getTokyoDayRange(now = new Date()) {
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

export function formatShrineTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
