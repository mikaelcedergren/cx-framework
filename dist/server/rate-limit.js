import { HttpError } from "./errors.js";
const MAX_RATE_LIMIT_KEY_LENGTH = 512;
export function createBoundedRateLimiter({ limit, maxKeys, now = Date.now, windowMs, }) {
    assertPositiveSafeInteger(limit, "Rate limit");
    assertPositiveSafeInteger(maxKeys, "Rate-limit key capacity");
    assertPositiveSafeInteger(windowMs, "Rate-limit window");
    if (typeof now !== "function") {
        throw new Error("A rate-limit clock must be a function.");
    }
    const entries = new Map();
    function clock() {
        const value = now();
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error("The rate-limit clock must return non-negative epoch milliseconds.");
        }
        return value;
    }
    function pruneAt(timestamp) {
        let removed = 0;
        for (const [key, entry] of entries) {
            if (timestamp < entry.resetAt)
                continue;
            entries.delete(key);
            removed += 1;
        }
        return removed;
    }
    return {
        get size() {
            return entries.size;
        },
        clear(key) {
            return entries.delete(validateRateLimitKey(key));
        },
        consume(key) {
            const safeKey = validateRateLimitKey(key);
            const timestamp = clock();
            let entry = entries.get(safeKey);
            if (entry && timestamp >= entry.resetAt) {
                entries.delete(safeKey);
                entry = undefined;
            }
            if (!entry) {
                pruneAt(timestamp);
                if (entries.size >= maxKeys) {
                    return decision({
                        allowed: false,
                        limit,
                        reason: "capacity",
                        remaining: 0,
                        resetAt: earliestReset(entries),
                    });
                }
                const resetAt = timestamp + windowMs;
                if (!Number.isSafeInteger(resetAt)) {
                    throw new Error("The rate-limit reset time exceeds the safe integer range.");
                }
                entry = { count: 1, resetAt };
                entries.set(safeKey, entry);
                return decision({
                    allowed: true,
                    limit,
                    remaining: limit - 1,
                    resetAt,
                });
            }
            if (entry.count >= limit) {
                return decision({
                    allowed: false,
                    limit,
                    reason: "limit",
                    remaining: 0,
                    resetAt: entry.resetAt,
                });
            }
            entry.count += 1;
            return decision({
                allowed: true,
                limit,
                remaining: limit - entry.count,
                resetAt: entry.resetAt,
            });
        },
        prune() {
            return pruneAt(clock());
        },
    };
}
/** Apply one bounded limiter without introducing a process-global cache or framework-specific IP parser. */
export function rateLimitMiddleware({ code = "rate_limited", key, limiter, message = "Too many requests. Please wait and try again.", now = Date.now, }) {
    if (!limiter || typeof limiter.consume !== "function") {
        throw new Error("Rate-limit middleware requires a bounded limiter.");
    }
    if (typeof key !== "function") {
        throw new Error("Rate-limit middleware requires a request-key function.");
    }
    if (typeof now !== "function") {
        throw new Error("Rate-limit middleware requires a clock function.");
    }
    // Validate the public error contract once during startup.
    new HttpError({ code, message, status: 429 });
    return (request, response, next) => {
        let decision;
        let timestamp;
        try {
            decision = limiter.consume(key(request));
            timestamp = now();
            if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
                throw new Error("The rate-limit middleware clock must return non-negative epoch milliseconds.");
            }
        }
        catch (error) {
            next(error);
            return;
        }
        response.setHeader("RateLimit-Limit", String(decision.limit));
        response.setHeader("RateLimit-Remaining", String(decision.remaining));
        response.setHeader("RateLimit-Reset", String(Math.ceil(decision.resetAt / 1_000)));
        if (decision.allowed) {
            next();
            return;
        }
        response.setHeader("Retry-After", String(Math.max(1, Math.ceil((decision.resetAt - timestamp) / 1_000))));
        next(new HttpError({ code, message, status: 429 }));
    };
}
function decision(value) {
    return Object.freeze(value);
}
function earliestReset(entries) {
    let earliest = Number.MAX_SAFE_INTEGER;
    for (const entry of entries.values())
        earliest = Math.min(earliest, entry.resetAt);
    return earliest;
}
function validateRateLimitKey(key) {
    if (typeof key !== "string" ||
        !key ||
        key.length > MAX_RATE_LIMIT_KEY_LENGTH) {
        throw new Error(`Rate-limit keys must contain between 1 and ${MAX_RATE_LIMIT_KEY_LENGTH} characters.`);
    }
    return key;
}
function assertPositiveSafeInteger(value, label) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`${label} must be a positive safe integer.`);
    }
}
