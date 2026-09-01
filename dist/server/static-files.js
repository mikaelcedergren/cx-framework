import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { nodeEnvironmentValue, optionalEnvironmentValue, releaseValidationEnvironmentValue, } from "./configuration.js";
import { createRetainedBrowserAssetResolver, readBrowserReleaseSnapshot, resolveBrowserDirectory, validateBrowserDirectory, } from "./browser-releases.js";
import { decodeSafeRequestPathname, } from "./http.js";
import { missingAssetMiddleware, ONE_YEAR_SECONDS, setStaticCacheHeaders, } from "./security.js";
const STATIC_SNAPSHOT_CACHE_LIMIT = 8;
/** Require a validated browser snapshot only for an ordinary production web process. */
export function assertBrowserServingForStartup({ browserServing, environment, }) {
    const nodeEnvironment = nodeEnvironmentValue(environment);
    const releaseValidation = releaseValidationEnvironmentValue(environment);
    if (browserServing.mode === "override") {
        assertBrowserOverrideRuntimePolicy(browserServing.browserDir, environment, nodeEnvironment, releaseValidation);
        return releaseValidation ? browserServing.assertAvailable() : undefined;
    }
    if (releaseValidation)
        return undefined;
    if (nodeEnvironment !== "production")
        return undefined;
    return browserServing.assertAvailable();
}
/** Resolve the one browser override while enforcing its development/validation-only boundary. */
export function resolveBrowserDirectoryOverride({ browserDirOverride, environment, repoRoot, }) {
    const environmentOverride = optionalEnvironmentValue(environment, "SITE_BROWSER_DIR");
    if (browserDirOverride !== undefined && environmentOverride !== undefined) {
        throw new Error("Configure the browser directory override once, not in both options and SITE_BROWSER_DIR.");
    }
    const selected = browserDirOverride ?? environmentOverride;
    if (selected === undefined)
        return undefined;
    if (typeof selected !== "string" ||
        !selected ||
        selected !== selected.trim() ||
        /[\u0000-\u001f\u007f]/.test(selected)) {
        throw new Error("Browser directory override must be a safe non-empty path.");
    }
    const resolved = isAbsolute(selected)
        ? resolve(selected)
        : resolve(repoRoot, selected);
    const nodeEnvironment = nodeEnvironmentValue(environment);
    const releaseValidation = releaseValidationEnvironmentValue(environment);
    assertBrowserOverrideRuntimePolicy(resolved, environment, nodeEnvironment, releaseValidation);
    return resolved;
}
export function staticFileOptions(overrides = {}) {
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
        throw new Error("Static-file options must be an object.");
    }
    for (const reserved of [
        "dotfiles",
        "extensions",
        "index",
        "redirect",
        "setHeaders",
    ]) {
        if (Object.hasOwn(overrides, reserved)) {
            throw new Error(`Static-file option ${reserved} is owned by the shared serving contract.`);
        }
    }
    return Object.freeze({
        ...overrides,
        dotfiles: "ignore",
        index: false,
        redirect: false,
        setHeaders: setStaticCacheHeaders,
    });
}
export function resolvePrerenderedEntry(browserDir, requestPath) {
    const segments = safeRequestSegments(requestPath);
    if (!segments)
        return undefined;
    const browserRoot = resolve(browserDir);
    const candidate = segments.length === 0
        ? join(browserRoot, "index.html")
        : resolve(browserRoot, ...segments, "index.html");
    return isContainedPath(browserRoot, candidate) ? candidate : undefined;
}
export function createBrowserServing({ express, repoRoot, defaultBrowserDir, browserDirOverride, }) {
    if (!express || typeof express.static !== "function") {
        throw new Error("createBrowserServing requires an Express-compatible static-file factory.");
    }
    const selection = resolveBrowserDirectory({
        repoRoot,
        defaultBrowserDir,
        ...(browserDirOverride === undefined ? {} : { browserDirOverride }),
    });
    const requestSnapshots = new WeakMap();
    const validatedSnapshots = new Map();
    function assertAvailable() {
        return snapshotDirectory(selection, validatedSnapshots, true);
    }
    function browserDirForRequest(request) {
        if ((typeof request !== "object" && typeof request !== "function") ||
            request === null) {
            throw new Error("A request object is required to resolve a browser release snapshot.");
        }
        let snapshot = requestSnapshots.get(request);
        if (!snapshot) {
            snapshot = snapshotDirectory(selection, validatedSnapshots);
            requestSnapshots.set(request, snapshot);
        }
        return snapshot;
    }
    function staticMiddleware(options = staticFileOptions(), subdirectory = "") {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new Error("Static-file options must be an object.");
        }
        assertCanonicalStaticOptions(options);
        const safeSubdirectory = normalizeStaticSubdirectory(subdirectory);
        const middlewareBySnapshot = new Map();
        return (request, response, next) => {
            let snapshot;
            try {
                snapshot = browserDirForRequest(request);
            }
            catch (error) {
                next(error);
                return;
            }
            const staticRoot = safeSubdirectory
                ? join(snapshot, safeSubdirectory)
                : snapshot;
            try {
                if (!isSafeStaticRequest(staticRoot, request.path ?? request.url ?? "/")) {
                    next();
                    return;
                }
            }
            catch (error) {
                next(error);
                return;
            }
            let middleware = middlewareBySnapshot.get(staticRoot);
            if (middleware) {
                middlewareBySnapshot.delete(staticRoot);
                middlewareBySnapshot.set(staticRoot, middleware);
            }
            else {
                try {
                    const candidate = express.static(staticRoot, options);
                    if (typeof candidate !== "function") {
                        throw new Error("The Express-compatible static-file factory must return middleware.");
                    }
                    middleware = candidate;
                }
                catch (error) {
                    next(error);
                    return;
                }
                if (middlewareBySnapshot.size >= STATIC_SNAPSHOT_CACHE_LIMIT) {
                    const oldest = middlewareBySnapshot.keys().next().value;
                    if (oldest !== undefined)
                        middlewareBySnapshot.delete(oldest);
                }
                middlewareBySnapshot.set(staticRoot, middleware);
            }
            return middleware(request, response, next);
        };
    }
    function sendFileForRequest(request, response, filePath) {
        if (!response || typeof response.sendFile !== "function") {
            throw new Error("sendFileForRequest requires an Express-compatible response.");
        }
        if (typeof filePath !== "string" ||
            !filePath ||
            filePath !== filePath.trim() ||
            /[\u0000-\u001f\u007f]/.test(filePath)) {
            throw new Error("sendFileForRequest requires a safe file path.");
        }
        const snapshot = browserDirForRequest(request);
        const candidate = isAbsolute(filePath)
            ? resolve(filePath)
            : resolve(snapshot, filePath);
        if (!isContainedPath(snapshot, candidate)) {
            throw new Error(`Browser response file escapes its release snapshot: ${filePath}`);
        }
        const entry = lstatIfPresent(candidate);
        if (!entry?.isFile() || entry.isSymbolicLink()) {
            throw new Error(`Browser response file is missing or unsafe: ${filePath}`);
        }
        const canonicalCandidate = realpathSync(candidate);
        if (!isContainedPath(snapshot, canonicalCandidate)) {
            throw new Error(`Browser response file escapes its release snapshot: ${filePath}`);
        }
        setStaticCacheHeaders(response, canonicalCandidate);
        return response.sendFile(relative(snapshot, canonicalCandidate), {
            dotfiles: "deny",
            root: snapshot,
        });
    }
    return Object.freeze({
        assertAvailable,
        browserDir: selection.browserDir,
        browserDirForRequest,
        mode: selection.mode,
        sendFileForRequest,
        staticMiddleware,
        useReleaseHistory: selection.useReleaseHistory,
    });
}
/**
 * Compose the canonical browser static -> retained asset -> missing asset -> SPA fallback chain.
 *
 * Callers mount the returned middleware in order, then mount their JSON error middleware. Every
 * synchronous browser-resolution or send-file failure is forwarded through `next(error)` so an
 * Express default HTML error page can never escape a product's API/error contract.
 */
export function createSinglePageApplicationMiddlewareStack({ apiPathPrefix = "/api", browserServing, entryFile = "index.html", repoRoot, }) {
    const excludedPrefix = requireSafePathPrefix(apiPathPrefix, "SPA API path prefix");
    if (typeof entryFile !== "string" ||
        !entryFile ||
        entryFile !== entryFile.trim() ||
        isAbsolute(entryFile) ||
        /[\u0000-\u001f\u007f\\?#]/.test(entryFile)) {
        throw new Error("SPA entry file must be one safe relative path.");
    }
    if (!browserServing ||
        typeof browserServing.staticMiddleware !== "function" ||
        typeof browserServing.sendFileForRequest !== "function") {
        throw new Error("SPA middleware requires one BrowserServing contract.");
    }
    if (typeof repoRoot !== "string" ||
        !repoRoot ||
        !isAbsolute(repoRoot) ||
        resolve(repoRoot) !== repoRoot) {
        throw new Error("SPA retained-release root must be one canonical absolute path.");
    }
    const stack = [
        browserServing.staticMiddleware(staticFileOptions()),
    ];
    if (browserServing.useReleaseHistory) {
        stack.push(retainedReleaseAssetMiddleware({ repoRoot }));
    }
    stack.push(missingAssetMiddleware());
    stack.push((request, response, next) => {
        if (!["GET", "HEAD"].includes(request.method ?? "")) {
            next();
            return;
        }
        const pathname = decodeSafeRequestPathname(request.path ?? request.url ?? "");
        if (pathname === undefined) {
            next(new Error("SPA request path is invalid."));
            return;
        }
        if (pathname === excludedPrefix ||
            pathname.startsWith(`${excludedPrefix}/`)) {
            next();
            return;
        }
        try {
            browserServing.sendFileForRequest(request, response, entryFile);
        }
        catch (error) {
            next(error);
        }
    });
    return Object.freeze(stack);
}
function requireSafePathPrefix(value, label) {
    const normalized = decodeSafeRequestPathname(value);
    if (normalized === undefined || normalized === "/" || normalized !== value) {
        throw new Error(`${label} must be one safe absolute path prefix.`);
    }
    return normalized;
}
function assertBrowserOverrideRuntimePolicy(browserDir, environment, nodeEnvironment = nodeEnvironmentValue(environment), releaseValidation = releaseValidationEnvironmentValue(environment)) {
    if (nodeEnvironment === "production" && !releaseValidation) {
        throw new Error("SITE_BROWSER_DIR is forbidden in ordinary production; use the active versioned browser release.");
    }
    if (!releaseValidation)
        return;
    const configuredRoot = environment["CX_RUNTIME_ROOT"];
    if (typeof configuredRoot !== "string" ||
        !configuredRoot ||
        configuredRoot !== configuredRoot.trim() ||
        !isAbsolute(configuredRoot) ||
        resolve(configuredRoot) !== configuredRoot ||
        /[\u0000-\u001f\u007f]/.test(configuredRoot)) {
        throw new Error("CX_RELEASE_VALIDATION=1 requires CX_RUNTIME_ROOT to be one canonical absolute path.");
    }
    const rootEntry = lstatIfPresent(configuredRoot);
    if (!rootEntry?.isDirectory() ||
        rootEntry.isSymbolicLink() ||
        realpathSync(configuredRoot) !== configuredRoot) {
        throw new Error("CX_RELEASE_VALIDATION=1 requires CX_RUNTIME_ROOT to be one real canonical directory.");
    }
    if (!isContainedPath(configuredRoot, browserDir)) {
        throw new Error("Release-validation browser output must stay inside CX_RUNTIME_ROOT.");
    }
}
function assertCanonicalStaticOptions(options) {
    if (options["dotfiles"] !== "ignore" ||
        options["index"] !== false ||
        options["redirect"] !== false ||
        options["setHeaders"] !== setStaticCacheHeaders ||
        Object.hasOwn(options, "extensions")) {
        throw new Error("Static middleware requires staticFileOptions() so cache, dotfile, index, and redirect behavior cannot drift.");
    }
}
function isSafeStaticRequest(root, requestPath) {
    const segments = safeRequestSegments(requestPath);
    if (!segments || segments.some((segment) => segment.startsWith("."))) {
        return false;
    }
    const resolvedRoot = resolve(root);
    const rootEntry = lstatIfPresent(resolvedRoot);
    if (!rootEntry)
        return true;
    if (!rootEntry.isDirectory() || rootEntry.isSymbolicLink()) {
        throw new Error(`Static-file root is unsafe: ${resolvedRoot}`);
    }
    const canonicalRoot = realpathSync(resolvedRoot);
    let candidate = resolvedRoot;
    for (const segment of segments) {
        candidate = join(candidate, segment);
        const entry = lstatIfPresent(candidate);
        if (!entry)
            return true;
        if (entry.isSymbolicLink()) {
            throw new Error(`Static-file path contains a symbolic link: ${candidate}`);
        }
        if (!entry.isFile() && !entry.isDirectory()) {
            throw new Error(`Static-file path contains an unsupported filesystem entry: ${candidate}`);
        }
        const canonicalCandidate = realpathSync(candidate);
        if (canonicalCandidate !== canonicalRoot &&
            !isContainedPath(canonicalRoot, canonicalCandidate)) {
            throw new Error(`Static-file path escapes its browser root: ${candidate}`);
        }
    }
    return true;
}
export function retainedReleaseAssetMiddleware({ repoRoot, }) {
    const findRetainedAsset = createRetainedBrowserAssetResolver(repoRoot);
    return (request, response, next) => {
        if (!["GET", "HEAD"].includes(request.method ?? "")) {
            next();
            return;
        }
        const asset = findRetainedAsset(request.path ?? request.url ?? "");
        if (!asset) {
            next();
            return;
        }
        response.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
        response.sendFile(asset.relativePath, {
            dotfiles: "deny",
            root: asset.canonicalBrowserDir,
        });
    };
}
function snapshotDirectory(selection, validatedSnapshots, required = false) {
    const candidate = selection.mode === "active-release"
        ? realpathSync(selection.browserDir)
        : selection.browserDir;
    const inspected = inspectBrowserSnapshot(candidate);
    if (!inspected) {
        if (selection.mode === "active-release") {
            throw new Error(`Active browser release is missing: ${candidate}`);
        }
        if (required) {
            throw new Error(`Browser snapshot is missing: ${resolve(candidate)}`);
        }
        return resolve(candidate);
    }
    const { canonical, identity } = inspected;
    const cached = validatedSnapshots.get(identity);
    if (cached) {
        validatedSnapshots.delete(identity);
        validatedSnapshots.set(identity, cached);
        return cached;
    }
    let snapshot;
    if (selection.mode === "active-release") {
        if (!selection.repoRoot) {
            throw new Error("An active browser release requires its repository root.");
        }
        snapshot = readBrowserReleaseSnapshot(selection.repoRoot, canonical).canonicalBrowserDir;
    }
    else {
        snapshot = validateBrowserDirectory(candidate);
    }
    if (snapshot !== canonical) {
        throw new Error(`Browser snapshot identity changed during validation: ${candidate}`);
    }
    if (validatedSnapshots.size >= STATIC_SNAPSHOT_CACHE_LIMIT) {
        const oldest = validatedSnapshots.keys().next().value;
        if (oldest !== undefined)
            validatedSnapshots.delete(oldest);
    }
    validatedSnapshots.set(identity, snapshot);
    return snapshot;
}
function inspectBrowserSnapshot(candidate) {
    try {
        const entry = lstatSync(candidate, { bigint: true });
        if (!entry.isDirectory() || entry.isSymbolicLink()) {
            throw new Error(`Browser snapshot is unsafe: ${candidate}`);
        }
        const canonical = realpathSync(candidate);
        return Object.freeze({
            canonical,
            identity: `${canonical}:${entry.dev}:${entry.ino}:${entry.ctimeNs}`,
        });
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
function safeRequestSegments(requestPath) {
    const pathname = decodeSafeRequestPathname(requestPath);
    if (!pathname)
        return undefined;
    return pathname === "/" ? [] : pathname.slice(1).split("/");
}
function normalizeStaticSubdirectory(value) {
    if (value === "")
        return "";
    if (typeof value !== "string" ||
        value !== value.trim() ||
        value.startsWith("/") ||
        /[\u0000-\u001f\u007f\\]/.test(value)) {
        throw new Error(`Static-file subdirectory must stay inside the browser root: ${String(value)}`);
    }
    const segments = value.split("/");
    if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
        throw new Error(`Static-file subdirectory must stay inside the browser root: ${value}`);
    }
    return segments.join(sep);
}
function isContainedPath(parent, candidate) {
    const contained = relative(resolve(parent), resolve(candidate));
    return (contained !== "" &&
        contained !== ".." &&
        !contained.startsWith(`..${sep}`) &&
        !isAbsolute(contained));
}
function lstatIfPresent(candidate) {
    try {
        return lstatSync(candidate);
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return undefined;
        throw error;
    }
}
function isNodeError(error) {
    return error instanceof Error && "code" in error;
}
