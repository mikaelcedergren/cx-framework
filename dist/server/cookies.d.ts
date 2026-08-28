export type CookieHeader = string | readonly string[] | undefined;
export interface SerializeCookieOptions {
    expires?: Date;
    httpOnly?: boolean;
    maxAgeSeconds?: number;
    path?: string;
    sameSite?: "lax" | "none" | "strict";
    secure?: boolean;
}
export declare function validateCookieName(name: string): string;
export declare function validateCookieValue(value: string): string;
/**
 * Parse only unambiguous, syntactically valid cookies.
 *
 * Duplicate names are removed rather than choosing whichever header happened to arrive first.
 * Authentication code can therefore fail closed when a client sends conflicting cookie values.
 */
export declare function parseCookieHeader(header: CookieHeader): ReadonlyMap<string, string>;
export declare function readCookie(header: CookieHeader, name: string): string | undefined;
export declare function serializeCookie(name: string, value: string, { expires, httpOnly, maxAgeSeconds, path, sameSite, secure, }?: SerializeCookieOptions): string;
//# sourceMappingURL=cookies.d.ts.map