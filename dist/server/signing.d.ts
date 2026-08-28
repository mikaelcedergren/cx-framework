export type HmacSecret = string | Uint8Array;
export interface HmacSigningKey {
    readonly id: string;
    readonly secret: HmacSecret;
}
export interface HmacTokenCodecOptions {
    readonly activeKeyId: string;
    readonly keys: readonly HmacSigningKey[];
    readonly maxPayloadBytes?: number;
    /** A stable, use-specific value. Tokens cannot verify under another purpose. */
    readonly purpose: string;
}
export interface VerifiedHmacToken {
    readonly keyId: string;
    readonly payload: Uint8Array;
}
export interface VerifiedHmacTextToken {
    readonly keyId: string;
    readonly payload: string;
}
export interface HmacTokenCodec {
    readonly activeKeyId: string;
    readonly maxPayloadBytes: number;
    sign(payload: Uint8Array): string;
    signUtf8(payload: string): string;
    verify(token: string): VerifiedHmacToken | null;
    verifyUtf8(token: string): VerifiedHmacTextToken | null;
}
export interface Sha256HexOptions {
    /** A stricter call-site bound; it cannot exceed the framework's 16 MiB ceiling. */
    readonly maxInputBytes?: number;
}
/** Return the canonical lowercase SHA-256 fingerprint of a bounded byte or UTF-8 value. */
export declare function sha256Hex(value: string | Uint8Array, { maxInputBytes }?: Sha256HexOptions): string;
/** Generate a cryptographically strong, cookie-safe identifier with a deliberate size bound. */
export declare function randomBase64UrlIdentifier(byteLength?: number): string;
/**
 * Create a compact, versioned HMAC-SHA-256 token codec.
 *
 * Tokens are authenticated, not encrypted. The purpose is included in the MAC rather than the
 * token so two features cannot accept each other's tokens even if they share key material.
 */
export declare function createHmacTokenCodec({ activeKeyId, keys, maxPayloadBytes, purpose, }: HmacTokenCodecOptions): HmacTokenCodec;
//# sourceMappingURL=signing.d.ts.map