const COOKIE_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const COOKIE_VALUE_PATTERN = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]*$/;
export function validateCookieName(name) {
    if (typeof name !== "string" || !COOKIE_NAME_PATTERN.test(name)) {
        throw new Error(`Invalid cookie name: ${name}`);
    }
    return name;
}
export function validateCookieValue(value) {
    if (typeof value !== "string" || !COOKIE_VALUE_PATTERN.test(value)) {
        throw new Error("Cookie values must use the RFC cookie-octet character set.");
    }
    return value;
}
/**
 * Parse only unambiguous, syntactically valid cookies.
 *
 * Duplicate names are removed rather than choosing whichever header happened to arrive first.
 * Authentication code can therefore fail closed when a client sends conflicting cookie values.
 */
export function parseCookieHeader(header) {
    const headers = typeof header === "string" ? [header] : (header ?? []);
    const cookies = new Map();
    const ambiguousNames = new Set();
    const seenNames = new Set();
    for (const source of headers) {
        if (typeof source !== "string")
            continue;
        for (const segment of source.split(";")) {
            const pair = segment.trim();
            const separator = pair.indexOf("=");
            if (separator < 1)
                continue;
            const name = pair.slice(0, separator).trim();
            const value = pair.slice(separator + 1).trim();
            if (!COOKIE_NAME_PATTERN.test(name) || ambiguousNames.has(name)) {
                continue;
            }
            if (seenNames.has(name)) {
                cookies.delete(name);
                ambiguousNames.add(name);
                continue;
            }
            seenNames.add(name);
            if (!COOKIE_VALUE_PATTERN.test(value))
                continue;
            cookies.set(name, value);
        }
    }
    return cookies;
}
export function readCookie(header, name) {
    return parseCookieHeader(header).get(validateCookieName(name));
}
export function serializeCookie(name, value, { expires, httpOnly = true, maxAgeSeconds, path = "/", sameSite = "lax", secure = false, } = {}) {
    const safeName = validateCookieName(name);
    const safeValue = validateCookieValue(value);
    const safePath = validateCookiePath(path);
    if (typeof httpOnly !== "boolean" || typeof secure !== "boolean") {
        throw new Error("Cookie HttpOnly and Secure options must be booleans.");
    }
    if (maxAgeSeconds !== undefined &&
        (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 0)) {
        throw new Error("Cookie Max-Age must be a non-negative whole number of seconds.");
    }
    if (expires !== undefined &&
        (!(expires instanceof Date) || !Number.isFinite(expires.getTime()))) {
        throw new Error("Cookie expiry must be a valid date.");
    }
    if (!["lax", "none", "strict"].includes(sameSite)) {
        throw new Error("Cookie SameSite must be lax, none, or strict.");
    }
    if (sameSite === "none" && !secure) {
        throw new Error("SameSite=None cookies must also be Secure.");
    }
    const attributes = [`${safeName}=${safeValue}`, `Path=${safePath}`];
    if (maxAgeSeconds !== undefined)
        attributes.push(`Max-Age=${maxAgeSeconds}`);
    if (expires !== undefined)
        attributes.push(`Expires=${expires.toUTCString()}`);
    if (httpOnly)
        attributes.push("HttpOnly");
    if (secure)
        attributes.push("Secure");
    attributes.push(`SameSite=${capitalizeSameSite(sameSite)}`);
    return attributes.join("; ");
}
function validateCookiePath(path) {
    if (typeof path !== "string" ||
        !path.startsWith("/") ||
        path.startsWith("//") ||
        !/^[\x21-\x7e]+$/.test(path) ||
        /[;\\?#]/.test(path)) {
        throw new Error(`Cookie paths must be safe absolute paths: ${path}`);
    }
    return path;
}
function capitalizeSameSite(value) {
    return `${value[0]?.toUpperCase()}${value.slice(1)}`;
}
