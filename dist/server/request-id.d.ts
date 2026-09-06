import type { HttpRequest, Middleware } from "./http.js";
export declare const REQUEST_ID_HEADER = "X-Request-ID";
export declare function createRequestId(): string;
export declare function requestIdFrom(request: HttpRequest): string | undefined;
export declare function requestIdMiddleware({ generate, trustedProxyAddress, }?: {
    generate?: () => string;
    trustedProxyAddress?: "127.0.0.1" | "::1";
}): Middleware;
//# sourceMappingURL=request-id.d.ts.map