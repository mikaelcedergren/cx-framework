import { decodeSafeRequestPathname } from "./http.js";
export const ONE_YEAR_SECONDS = 31_536_000;
export const HASHED_ASSET = /(?:\.[0-9a-f]{8,}\.[a-z0-9]+|(?:^|\/)(?:chunk|main|polyfills|runtime|styles)-[a-z0-9_-]{8,}\.(?:css|js|map|mjs))$/i;
const ASSET_EXTENSION = /\.(?:avif|bmp|css|eot|gif|ico|jpe?g|js|json|map|mjs|mp3|mp4|ogg|otf|pdf|png|svg|ttf|txt|wasm|webmanifest|webm|webp|woff2?|xml)$/i;
const STATIC_PATH_PREFIX = /^\/(?:assets|brand|fonts|icons|images)\//i;
const STATIC_ROOT_FILE = /^\/(?:apple-touch-icon|favicon|manifest|robots|sitemap)(?:[.-]|$)/i;
export function hardenApplication(application) {
    application.set("trust proxy", 1);
    application.disable("x-powered-by");
    return application;
}
export function securityHeaders({ frameOptions = "DENY", } = {}) {
    return (_request, response, next) => {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", frameOptions);
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
        response.setHeader("Origin-Agent-Cluster", "?1");
        response.setHeader("X-DNS-Prefetch-Control", "off");
        response.setHeader("X-Download-Options", "noopen");
        response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
        response.setHeader("X-XSS-Protection", "0");
        next();
    };
}
export function noindexHeader(paths = []) {
    const prefixes = paths.map(normalizePathPrefix);
    return (request, response, next) => {
        const requestPath = decodeSafeRequestPathname(String(request.path ?? request.url ?? ""))?.toLowerCase();
        if (requestPath &&
            prefixes.some((prefix) => requestPath === prefix || requestPath.startsWith(`${prefix}/`))) {
            response.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        next();
    };
}
export function noStoreHeader() {
    return (_request, response, next) => {
        response.setHeader("Cache-Control", "private, no-store");
        next();
    };
}
export function setStaticCacheHeaders(response, filePath) {
    if (hasNoStoreCacheDirective(response.getHeader?.("Cache-Control")))
        return;
    if (filePath.endsWith(".html")) {
        response.setHeader("Cache-Control", "no-cache");
    }
    else if (filePath.endsWith("cx-build.json")) {
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    }
    else if (HASHED_ASSET.test(filePath)) {
        response.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
    }
    else {
        response.setHeader("Cache-Control", "public, max-age=3600");
    }
}
export function hasNoStoreCacheDirective(value) {
    const values = Array.isArray(value) ? value : [value];
    return values.some((candidate) => typeof candidate === "string" &&
        candidate
            .split(",")
            .some((directive) => directive.trim().toLowerCase() === "no-store"));
}
export function isAssetRequestPath(requestPath) {
    let pathname;
    try {
        pathname = decodeURIComponent(requestPath.split(/[?#]/, 1)[0] || "/");
    }
    catch {
        return true;
    }
    return (ASSET_EXTENSION.test(pathname) ||
        STATIC_PATH_PREFIX.test(pathname) ||
        STATIC_ROOT_FILE.test(pathname));
}
export function missingAssetMiddleware() {
    return (request, response, next) => {
        if (!["GET", "HEAD"].includes(request.method ?? "") ||
            !isAssetRequestPath(request.path ?? request.url ?? "")) {
            next();
            return;
        }
        response.setHeader("Cache-Control", "no-store");
        response.status(404).type("text/plain").send("Asset not found");
    };
}
function normalizePathPrefix(value) {
    if (typeof value !== "string" ||
        value !== value.trim() ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        /[\u0000-\u001f\u007f\\?#]/.test(value)) {
        throw new Error(`Noindex path must be a safe absolute path prefix: ${String(value)}`);
    }
    const source = value.toLowerCase();
    const prefix = source.replace(/\/+$/, "");
    if (!prefix)
        throw new Error('A noindex path of "/" would hide the whole site from search.');
    return prefix;
}
