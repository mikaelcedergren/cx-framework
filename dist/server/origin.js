import { HttpError } from "./errors.js";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export function normalizeHttpOrigin(value) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        /[\u0000-\u0020\u007f\\]/.test(value)) {
        throw new Error("An origin must be a non-empty HTTP(S) origin.");
    }
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch (error) {
        throw new Error(`Invalid HTTP(S) origin: ${value}`, { cause: error });
    }
    if (!["http:", "https:"].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash ||
        parsed.origin === "null") {
        throw new Error(`Origin must contain only scheme, host, and port: ${value}`);
    }
    return parsed.origin;
}
export function createOriginGuard({ allowedOrigins, allowMissingOrigin = false, }) {
    if (typeof allowMissingOrigin !== "boolean") {
        throw new Error("allowMissingOrigin must be a boolean.");
    }
    if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
        throw new Error("Origin protection requires at least one allowed origin.");
    }
    const allowed = new Set(allowedOrigins.map(normalizeHttpOrigin));
    return (request, _response, next) => {
        const method = request.method?.toUpperCase() ?? "";
        if (SAFE_METHODS.has(method)) {
            next();
            return;
        }
        const supplied = request.headers?.["origin"];
        if (supplied === undefined) {
            if (allowMissingOrigin) {
                next();
            }
            else {
                next(new HttpError({
                    code: "origin_required",
                    message: "This request must include its origin.",
                    status: 403,
                }));
            }
            return;
        }
        if (typeof supplied !== "string") {
            next(originNotAllowed());
            return;
        }
        let normalized;
        try {
            normalized = normalizeHttpOrigin(supplied);
        }
        catch {
            next(originNotAllowed());
            return;
        }
        if (!allowed.has(normalized)) {
            next(originNotAllowed());
            return;
        }
        next();
    };
}
function originNotAllowed() {
    return new HttpError({
        code: "origin_not_allowed",
        message: "This request came from an origin that is not allowed.",
        status: 403,
    });
}
