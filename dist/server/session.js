import { readCookie as readRawCookie } from "./cookies.js";
import { createHmacTokenCodec, randomBase64UrlIdentifier, } from "./signing.js";
const SESSION_TOKEN_VERSION = 1;
const SESSION_ID_BYTES = 32;
const SESSION_ID_CHARACTERS = 43;
const SESSION_PAYLOAD_MAX_BYTES = 512;
const MAX_SESSION_TTL_SECONDS = 366 * 24 * 60 * 60;
const MAX_SESSION_CLOCK_SKEW_SECONDS = 5 * 60;
const APPLICATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SESSION_CLAIM_KEYS = Object.freeze([
    "expiresAt",
    "issuedAt",
    "sessionId",
    "version",
]);
/** Generate an opaque 256-bit identifier suitable for a durable session record. */
export function generateSessionId() {
    return randomBase64UrlIdentifier(SESSION_ID_BYTES);
}
/**
 * Create a signed opaque-session token codec. Identity, roles, revocation, and storage remain
 * product-owned; this primitive carries only a random session record ID and bounded timestamps.
 */
export function createSessionTokenCodec({ activeKeyId, applicationId, clockSkewSeconds = 0, keys, maximumTtlSeconds, now = Date.now, }) {
    if (typeof applicationId !== "string" ||
        !APPLICATION_ID_PATTERN.test(applicationId)) {
        throw new Error("Session applicationId must contain 1 to 64 safe ASCII characters.");
    }
    const safeMaximumTtlSeconds = positiveSafeInteger(maximumTtlSeconds, "Session maximumTtlSeconds");
    if (safeMaximumTtlSeconds > MAX_SESSION_TTL_SECONDS) {
        throw new Error(`Session maximumTtlSeconds cannot exceed ${MAX_SESSION_TTL_SECONDS}.`);
    }
    const safeClockSkewSeconds = nonNegativeSafeInteger(clockSkewSeconds, "Session clockSkewSeconds");
    if (safeClockSkewSeconds > MAX_SESSION_CLOCK_SKEW_SECONDS) {
        throw new Error(`Session clockSkewSeconds cannot exceed ${MAX_SESSION_CLOCK_SKEW_SECONDS}.`);
    }
    if (safeClockSkewSeconds > safeMaximumTtlSeconds) {
        throw new Error("Session clockSkewSeconds cannot exceed maximumTtlSeconds.");
    }
    if (typeof now !== "function") {
        throw new TypeError("Session now must be a function.");
    }
    const signer = createHmacTokenCodec({
        activeKeyId,
        keys,
        maxPayloadBytes: SESSION_PAYLOAD_MAX_BYTES,
        purpose: `cx.session.v1/${applicationId}`,
    });
    function currentEpochSeconds() {
        const milliseconds = now();
        if (!Number.isFinite(milliseconds) ||
            milliseconds < 0 ||
            !Number.isSafeInteger(Math.floor(milliseconds))) {
            throw new Error("Session clocks must return valid epoch milliseconds.");
        }
        return Math.floor(milliseconds / 1_000);
    }
    function issue({ sessionId = generateSessionId(), ttlSeconds, }) {
        const safeTtlSeconds = positiveSafeInteger(ttlSeconds, "Session ttlSeconds");
        if (safeTtlSeconds > safeMaximumTtlSeconds) {
            throw new Error("Session ttlSeconds cannot exceed the configured maximumTtlSeconds.");
        }
        const safeSessionId = validateSessionId(sessionId);
        const issuedAt = currentEpochSeconds();
        if (issuedAt > Number.MAX_SAFE_INTEGER - safeTtlSeconds) {
            throw new Error("The session expiry is outside the safe integer range.");
        }
        const expiresAt = issuedAt + safeTtlSeconds;
        const payload = serializeClaims({
            expiresAt,
            issuedAt,
            sessionId: safeSessionId,
        });
        const token = signer.signUtf8(payload);
        return Object.freeze({
            expiresAt,
            issuedAt,
            keyId: signer.activeKeyId,
            sessionId: safeSessionId,
            token,
        });
    }
    function verify(token) {
        const verified = signer.verifyUtf8(token);
        if (!verified)
            return null;
        let parsed;
        try {
            parsed = JSON.parse(verified.payload);
        }
        catch {
            return null;
        }
        const claims = parseClaims(parsed);
        if (!claims || serializeClaims(claims) !== verified.payload)
            return null;
        if (claims.expiresAt - claims.issuedAt > safeMaximumTtlSeconds ||
            claims.expiresAt <= claims.issuedAt) {
            return null;
        }
        const nowSeconds = currentEpochSeconds();
        if (claims.issuedAt > nowSeconds &&
            claims.issuedAt - nowSeconds > safeClockSkewSeconds) {
            return null;
        }
        if (nowSeconds >= claims.expiresAt &&
            nowSeconds - claims.expiresAt >= safeClockSkewSeconds) {
            return null;
        }
        return Object.freeze({
            ...claims,
            keyId: verified.keyId,
        });
    }
    function readCookie(header, name) {
        const token = readRawCookie(header, name);
        return token === undefined ? null : verify(token);
    }
    return Object.freeze({
        activeKeyId: signer.activeKeyId,
        issue,
        readCookie,
        verify,
    });
}
function serializeClaims(claims) {
    return JSON.stringify({
        expiresAt: claims.expiresAt,
        issuedAt: claims.issuedAt,
        sessionId: claims.sessionId,
        version: SESSION_TOKEN_VERSION,
    });
}
function parseClaims(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return null;
    const candidate = value;
    const keys = Object.keys(candidate).sort();
    if (keys.length !== SESSION_CLAIM_KEYS.length ||
        keys.some((key, index) => key !== SESSION_CLAIM_KEYS[index]) ||
        candidate["version"] !== SESSION_TOKEN_VERSION ||
        !nonNegativeSafeIntegerOrFalse(candidate["issuedAt"]) ||
        !nonNegativeSafeIntegerOrFalse(candidate["expiresAt"]) ||
        typeof candidate["sessionId"] !== "string") {
        return null;
    }
    try {
        return Object.freeze({
            expiresAt: candidate["expiresAt"],
            issuedAt: candidate["issuedAt"],
            sessionId: validateSessionId(candidate["sessionId"]),
        });
    }
    catch {
        return null;
    }
}
function validateSessionId(value) {
    if (typeof value !== "string" || !SESSION_ID_PATTERN.test(value)) {
        throw new Error(`Session IDs must be canonical ${SESSION_ID_CHARACTERS}-character base64url values.`);
    }
    const bytes = Buffer.from(value, "base64url");
    if (bytes.length !== SESSION_ID_BYTES ||
        bytes.toString("base64url") !== value) {
        bytes.fill(0);
        throw new Error("Session IDs must encode exactly 32 bytes.");
    }
    bytes.fill(0);
    return value;
}
function positiveSafeInteger(value, label) {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive safe integer.`);
    }
    return value;
}
function nonNegativeSafeInteger(value, label) {
    if (!nonNegativeSafeIntegerOrFalse(value)) {
        throw new Error(`${label} must be a non-negative safe integer.`);
    }
    return value;
}
function nonNegativeSafeIntegerOrFalse(value) {
    return Number.isSafeInteger(value) && typeof value === "number" && value >= 0;
}
