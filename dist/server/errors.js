import { createErrorRecorder } from "./logging.js";
export class HttpError extends Error {
    code;
    status;
    details;
    expose;
    constructor({ code, message, status, details, expose = true, cause, }) {
        super(message, cause === undefined ? undefined : { cause });
        if (code.length > 128 || !/^[a-z][a-z0-9_]*$/.test(code)) {
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
export function errorEnvelope(error, requestId) {
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
export function notFoundError(pathname) {
    return new HttpError({
        code: "route_not_found",
        message: `No route exists at ${pathname}.`,
        status: 404,
    });
}
export function apiNotFoundMiddleware() {
    return (request, _response, next) => {
        next(notFoundError(request.originalUrl ?? request.url ?? request.path ?? "/"));
    };
}
export function jsonErrorMiddleware({ logger, }) {
    const recordError = createErrorRecorder(logger);
    return (error, request, response, _next) => {
        const normalized = normalizeHttpError(error);
        if (!normalized.expose ||
            normalized.status >= 500 ||
            response.headersSent) {
            recordError({
                event: "http.internal_error",
                level: "error",
                category: "diagnostic",
                outcome: "failure",
                code: normalized.code,
                statusCode: normalized.status,
                ...(request.requestId ? { requestId: request.requestId } : {}),
                error,
            }, request);
        }
        if (response.headersSent) {
            // This is the terminal error boundary. Express's default handler would print the original
            // exception after closing the socket, bypassing the sanitized logger and duplicating it.
            response.destroy();
            return;
        }
        const result = errorEnvelope(normalized, request.requestId);
        response.status(result.status).type("application/json").json(result.body);
    };
}
export function normalizeHttpError(error) {
    if (error instanceof HttpError)
        return error;
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
function isExpressBodyError(error, type, status) {
    if (!error || typeof error !== "object")
        return false;
    const candidate = error;
    return candidate.type === type && candidate.status === status;
}
