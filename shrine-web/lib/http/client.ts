type ApiErrorPayload = {
  error?: unknown;
  code?: unknown;
  requestId?: unknown;
  resultId?: unknown;
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string,
    public readonly resultId?: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ClientApiError(fallbackMessage, 0, "NETWORK_ERROR");
  }

  let payload: ApiErrorPayload & T;

  try {
    payload = (await response.json()) as ApiErrorPayload & T;
  } catch {
    throw new ClientApiError(fallbackMessage, response.status, "INVALID_RESPONSE");
  }

  if (!response.ok) {
    throw new ClientApiError(
      typeof payload.error === "string" ? payload.error : fallbackMessage,
      response.status,
      typeof payload.code === "string" ? payload.code : undefined,
      typeof payload.requestId === "string" ? payload.requestId : undefined,
      typeof payload.resultId === "string" ? payload.resultId : undefined,
    );
  }

  return payload;
}
