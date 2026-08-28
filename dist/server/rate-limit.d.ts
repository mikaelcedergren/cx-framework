import type { HttpRequest, Middleware } from "./http.js";
export type RateLimitDenialReason = "capacity" | "limit";
export interface RateLimitDecision {
    readonly allowed: boolean;
    readonly limit: number;
    readonly reason?: RateLimitDenialReason;
    readonly remaining: number;
    readonly resetAt: number;
}
export interface BoundedRateLimiter {
    readonly size: number;
    clear(key: string): boolean;
    consume(key: string): RateLimitDecision;
    prune(): number;
}
export interface BoundedRateLimiterOptions {
    limit: number;
    maxKeys: number;
    now?: () => number;
    windowMs: number;
}
export interface RateLimitMiddlewareOptions {
    readonly code?: string;
    readonly key: (request: HttpRequest) => string;
    readonly limiter: BoundedRateLimiter;
    readonly message?: string;
    readonly now?: () => number;
}
export declare function createBoundedRateLimiter({ limit, maxKeys, now, windowMs, }: BoundedRateLimiterOptions): BoundedRateLimiter;
/** Apply one bounded limiter without introducing a process-global cache or framework-specific IP parser. */
export declare function rateLimitMiddleware({ code, key, limiter, message, now, }: RateLimitMiddlewareOptions): Middleware;
//# sourceMappingURL=rate-limit.d.ts.map