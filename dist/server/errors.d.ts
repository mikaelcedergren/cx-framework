import type { HttpRequest, HttpResponse, NextFunction } from "./http.js";
import { type RuntimeLogger } from "./logging.js";
export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | {
    readonly [key: string]: JsonValue;
};
export type ErrorDetails = Readonly<Record<string, JsonValue>>;
export interface ErrorEnvelope {
    error: {
        code: string;
        message: string;
        requestId?: string;
        details?: ErrorDetails;
    };
}
export declare class HttpError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details: ErrorDetails | undefined;
    readonly expose: boolean;
    constructor({ code, message, status, details, expose, cause, }: {
        code: string;
        message: string;
        status: number;
        details?: ErrorDetails;
        expose?: boolean;
        cause?: unknown;
    });
}
export declare function errorEnvelope(error: unknown, requestId?: string): {
    body: ErrorEnvelope;
    status: number;
};
export declare function notFoundError(pathname: string): HttpError;
export declare function apiNotFoundMiddleware(): (request: HttpRequest, _response: HttpResponse, next: NextFunction) => void;
export declare function jsonErrorMiddleware({ logger, }: {
    logger: Pick<RuntimeLogger, "emit">;
}): (error: unknown, request: HttpRequest, response: HttpResponse, _next: NextFunction) => void;
export declare function normalizeHttpError(error: unknown): HttpError;
//# sourceMappingURL=errors.d.ts.map