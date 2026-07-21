const SESSION_KEY = "ai-shrine-session";

let memorySessionId: string | undefined;

function createSessionId() {
  const randomPart =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `sess_${Date.now()}_${randomPart}`;
}

export function getOrCreateSessionId() {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);

    if (stored) return stored;

    const sessionId = memorySessionId ?? createSessionId();
    window.localStorage.setItem(SESSION_KEY, sessionId);
    memorySessionId = sessionId;
    return sessionId;
  } catch {
    memorySessionId ??= createSessionId();
    return memorySessionId;
  }
}
