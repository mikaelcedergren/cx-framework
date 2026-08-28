import { type CookieHeader } from "./cookies.js";
import { type HmacSigningKey } from "./signing.js";
export interface SessionTokenCodecOptions {
    readonly activeKeyId: string;
    /** A stable product identifier used to keep tokens from different products separate. */
    readonly applicationId: string;
    readonly clockSkewSeconds?: number;
    readonly keys: readonly HmacSigningKey[];
    /** Product-owned policy. No session token may live longer than this value. */
    readonly maximumTtlSeconds: number;
    readonly now?: () => number;
}
export interface IssueSessionTokenOptions {
    readonly sessionId?: string;
    readonly ttlSeconds: number;
}
export interface SessionTokenClaims {
    readonly expiresAt: number;
    readonly issuedAt: number;
    readonly sessionId: string;
}
export interface IssuedSessionToken extends SessionTokenClaims {
    readonly keyId: string;
    readonly token: string;
}
export interface VerifiedSessionToken extends SessionTokenClaims {
    readonly keyId: string;
}
export interface SessionTokenCodec {
    readonly activeKeyId: string;
    issue(options: IssueSessionTokenOptions): IssuedSessionToken;
    readCookie(header: CookieHeader, name: string): VerifiedSessionToken | null;
    verify(token: string): VerifiedSessionToken | null;
}
/** Generate an opaque 256-bit identifier suitable for a durable session record. */
export declare function generateSessionId(): string;
/**
 * Create a signed opaque-session token codec. Identity, roles, revocation, and storage remain
 * product-owned; this primitive carries only a random session record ID and bounded timestamps.
 */
export declare function createSessionTokenCodec({ activeKeyId, applicationId, clockSkewSeconds, keys, maximumTtlSeconds, now, }: SessionTokenCodecOptions): SessionTokenCodec;
//# sourceMappingURL=session.d.ts.map