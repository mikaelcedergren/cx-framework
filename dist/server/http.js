/** Decode one safe absolute request pathname using the static-serving path contract. */
export function decodeSafeRequestPathname(requestPath) {
    if (typeof requestPath !== "string")
        return undefined;
    let decoded;
    try {
        decoded = decodeURIComponent(requestPath.split(/[?#]/, 1)[0] || "/");
    }
    catch {
        return undefined;
    }
    if (!decoded.startsWith("/") ||
        decoded.startsWith("//") ||
        /[\u0000-\u001f\u007f\\]/.test(decoded)) {
        return undefined;
    }
    const pathname = decoded === "/" ? decoded : decoded.replace(/\/+$/, "");
    if (pathname === "/")
        return pathname;
    const segments = pathname.slice(1).split("/");
    if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
        return undefined;
    }
    return pathname;
}
