import type { HttpRequest, HttpResponse, NextFunction } from "./http.js";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type ErrorDetails = Readonly<Record<string, JsonValue>>;

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: ErrorDetails;
  };
}

export class HttpError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ErrorDetails | undefined;
  readonly expose: boolean;

  constructor({
    code,
    message,
    status,
    details,
    expose = true,
    cause,
  }: {
    code: string;
    message: string;
    status: number;
    details?: ErrorDetails;
    expose?: boolean;
    cause?: unknown;
  }) {
    super(message, cause === undefined ? undefined : { cause });
    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      throw new Error(`Invalid HTTP error code: ${code}`);
    }
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new Error(`Invalid HTTP error status: ${status}`);
    }
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.expose = expose;
  }
}

export function errorEnvelope(
  error: unknown,
  requestId?: string,
): {
  body: ErrorEnvelope;
  status: number;
} {
  const normalized = normalizeHttpError(error);
  const safeMessage = normalized.expose
    ? normalized.message
    : "The request could not be completed.";
  return {
    status: normalized.status,
    body: {
      error: {
        code: normalized.code,
        message: safeMessage,
        ...(requestId ? { requestId } : {}),
        ...(normalized.expose && normalized.details
          ? { details: normalized.details }
          : {}),
      },
    },
  };
}

export function notFoundError(pathname: string): HttpError {
  return new HttpError({
    code: "route_not_found",
    message: `No route exists at ${pathname}.`,
    status: 404,
  });
}

export function apiNotFoundMiddleware() {
  return (
    request: HttpRequest,
    _response: HttpResponse,
    next: NextFunction,
  ): void => {
    next(
      notFoundError(request.originalUrl ?? request.url ?? request.path ?? "/"),
    );
  };
}

export function jsonErrorMiddleware({
  onInternalError,
}: {
  onInternalError?: (error: unknown, request: HttpRequest) => void;
} = {}) {
  return (
    error: unknown,
    request: HttpRequest,
    response: HttpResponse,
    next: NextFunction,
  ): void => {
    if (response.headersSent) {
      next(error);
      return;
    }
    const normalized = normalizeHttpError(error);
    if (!normalized.expose) onInternalError?.(error, request);
    const result = errorEnvelope(normalized, request.requestId);
    response.status(result.status).type("application/json").json(result.body);
  };
}

export function normalizeHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (isExpressBodyError(error, "entity.parse.failed", 400)) {
    return new HttpError({
      code: "invalid_json",
      message: "The request body is not valid JSON.",
      status: 400,
      cause: error,
    });
  }
  if (isExpressBodyError(error, "entity.too.large", 413)) {
    return new HttpError({
      code: "request_too_large",
      message: "The request body is too large.",
      status: 413,
      cause: error,
    });
  }
  return new HttpError({
    code: "internal_error",
    message: "The request could not be completed.",
    status: 500,
    expose: false,
    cause: error,
  });
}

function isExpressBodyError(
  error: unknown,
  type: string,
  status: number,
): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; type?: unknown };
  return candidate.type === type && candidate.status === status;
}
