import { lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { localBindHost, nodeEnvironmentValue, portEnvironmentValue, releaseValidationEnvironmentValue, } from "./configuration.js";
import { apiNotFoundMiddleware, jsonErrorMiddleware } from "./errors.js";
import { healthMiddleware } from "./health.js";
import { createRuntimeLogger, } from "./logging.js";
import { requestIdMiddleware } from "./request-id.js";
import { assertServerProcessRole } from "./process-role.js";
import { loadProductManifestFile, } from "./product-manifest.js";
import { hardenApplication, missingAssetMiddleware, noindexHeader, securityHeaders, } from "./security.js";
import { loadServerReleaseIdentity, SERVER_IDENTITY_PATH, serverReleaseIdentityMiddleware, } from "./server-identity.js";
import { bindShutdownSignals, createGracefulShutdown, validateShutdownSignalNames, } from "./shutdown.js";
import { assertBrowserServingForStartup, createBrowserServing, resolveBrowserDirectoryOverride, retainedReleaseAssetMiddleware, resolvePrerenderedEntry, staticFileOptions, } from "./static-files.js";
import { assertTimerDelayMilliseconds } from "./timer.js";
export function loadStaticSiteManifest(manifestFile) {
    return loadStaticSiteManifestFile(manifestFile).manifest;
}
function loadStaticSiteManifestFile(manifestFile) {
    const loaded = loadProductManifestFile(manifestFile);
    const { capabilities, frontend, profile } = loaded.manifest;
    if (profile !== "static-site") {
        throw new Error("cx-product.json must declare the web static-site profile.");
    }
    if (frontend.framework !== "angular" || frontend.rendering !== "ssg") {
        throw new Error("cx-product.json static sites must use Angular SSG rendering.");
    }
    if (capabilities.authentication !== "none" ||
        capabilities.persistentData !== "none" ||
        !["none", "build-time"].includes(capabilities.backgroundWork)) {
        throw new Error("cx-product.json static sites cannot own runtime authentication, data, or background work.");
    }
    return loaded;
}
export function resolveStaticSiteConfiguration({ appName, browserDir, browserDirOverride, defaultPort, environment = process.env, manifestFile, repoRoot, serverIdentityFile, }) {
    const nodeEnvironment = nodeEnvironmentValue(environment);
    const releaseValidation = releaseValidationEnvironmentValue(environment);
    const root = validateRepositoryRoot(repoRoot);
    const loadedManifest = loadStaticSiteManifestFile(manifestFile);
    const resolvedManifestFile = loadedManifest.manifestFile;
    const manifest = loadedManifest.manifest;
    const configuredAppName = appName ?? manifest.id;
    if (!configuredAppName ||
        configuredAppName !== configuredAppName.trim() ||
        /[\u0000-\u001f\u007f]/.test(configuredAppName)) {
        throw new Error("Static-site appName must be safe non-empty text.");
    }
    const defaultBrowserDir = browserDir
        ? resolveConfiguredPath(root, browserDir, "browserDir")
        : join(root, "dist", "browser");
    const selectedOverride = resolveBrowserDirectoryOverride({
        ...(browserDirOverride === undefined ? {} : { browserDirOverride }),
        environment,
        repoRoot: root,
    });
    const port = portEnvironmentValue(environment, "PORT", defaultPort);
    const host = localBindHost(environment);
    const serverIdentity = loadServerReleaseIdentity({
        environment,
        ...(serverIdentityFile === undefined
            ? {}
            : { identityFile: serverIdentityFile }),
        required: nodeEnvironment === "production" || releaseValidation,
    });
    return Object.freeze({
        appName: configuredAppName,
        browserDir: defaultBrowserDir,
        ...(selectedOverride === undefined
            ? {}
            : { browserDirOverride: selectedOverride }),
        host,
        manifest,
        manifestFile: resolvedManifestFile,
        nodeEnvironment,
        port,
        releaseValidation,
        repoRoot: root,
        ...(serverIdentity === undefined ? {} : { serverIdentity }),
    });
}
export function createStaticSiteApplication(options) {
    if (!options || typeof options !== "object") {
        throw new Error("Static-site options are required.");
    }
    if (!options.express || typeof options.express !== "function") {
        throw new Error("Static-site entrypoint requires an Express-compatible factory.");
    }
    if (typeof options.compression !== "function") {
        throw new Error("Static-site compression must be a middleware factory.");
    }
    if (!(typeof options.entrypointUrl === "string" ||
        options.entrypointUrl instanceof URL)) {
        throw new Error("Static-site entrypointUrl is required.");
    }
    const noindexPaths = options.noindexPaths ?? [];
    const noindex = noindexHeader(noindexPaths);
    const configuration = resolveStaticSiteConfiguration(options);
    const logger = createRuntimeLogger({
        identity: {
            service: configuration.manifest.id,
            environment: configuration.nodeEnvironment,
            executionScope: (options.environment ?? process.env)["CX_EXECUTION_SCOPE"] ??
                (configuration.releaseValidation
                    ? "validation"
                    : configuration.nodeEnvironment),
            role: "web",
            releaseId: configuration.serverIdentity?.releaseId ?? "development",
            pid: process.pid,
        },
        ...(options.logSink === undefined ? {} : { sink: options.logSink }),
    });
    if (configuration.serverIdentity) {
        assertServerProcessRole({
            artifactRoot: dirname(configuration.manifestFile),
            entrypointUrl: options.entrypointUrl,
            identity: configuration.serverIdentity,
            role: { kind: "web" },
        });
    }
    const browserServing = createBrowserServing({
        express: options.express,
        repoRoot: configuration.repoRoot,
        defaultBrowserDir: configuration.browserDir,
        ...(configuration.browserDirOverride === undefined
            ? {}
            : { browserDirOverride: configuration.browserDirOverride }),
    });
    assertBrowserServingForStartup({
        browserServing,
        environment: options.environment ?? process.env,
    });
    const app = requireStaticSiteApplication(options.express());
    hardenApplication(app);
    app.use(requestIdMiddleware(options.trustedProxyAddress === undefined
        ? {}
        : { trustedProxyAddress: options.trustedProxyAddress }));
    app.use(securityHeaders({ frameOptions: options.frameOptions ?? "DENY" }));
    if (noindexPaths.length > 0)
        app.use(noindex);
    const compressionMiddleware = options.compression();
    if (typeof compressionMiddleware !== "function") {
        throw new Error("Static-site compression must return middleware.");
    }
    app.use(compressionMiddleware);
    if (configuration.serverIdentity) {
        app.get(SERVER_IDENTITY_PATH, serverReleaseIdentityMiddleware(configuration.serverIdentity));
    }
    app.get("/healthz", healthMiddleware(configuration.appName, configuration.port));
    app.use("/api", apiNotFoundMiddleware());
    app.use(browserServing.staticMiddleware(staticFileOptions()));
    if (browserServing.useReleaseHistory) {
        app.use(retainedReleaseAssetMiddleware({ repoRoot: configuration.repoRoot }));
    }
    app.use(missingAssetMiddleware());
    app.get(/.*/, (request, response, next) => {
        try {
            serveStaticSitePage(browserServing, request, response);
        }
        catch (error) {
            next(error);
        }
    });
    app.use(jsonErrorMiddleware({ logger }));
    return Object.freeze({ app, browserServing, configuration, logger });
}
export function createStaticSiteServer(options) {
    const shutdownTimeoutMs = options.shutdownTimeoutMs ?? 10_000;
    assertTimerDelayMilliseconds(shutdownTimeoutMs, "Static-site shutdown timeout");
    const shutdownSignalNames = validateShutdownSignalNames(options.shutdownSignalNames);
    const application = createStaticSiteApplication(options);
    const { host, port } = application.configuration;
    const { logger } = application;
    const onShutdownError = (error) => {
        logger.emit({
            event: "service.shutdown",
            level: "error",
            category: "operation",
            outcome: "failure",
            error,
        });
        if (options.onShutdownError)
            options.onShutdownError(error);
        else
            process.exitCode = 1;
    };
    const server = application.app.listen(port, host, (error) => {
        if (error) {
            logger.emit({
                event: "service.listen",
                level: "fatal",
                category: "operation",
                outcome: "failure",
                error,
            });
            process.exitCode = 1;
            return;
        }
        logger.emit({
            event: "service.listen",
            level: "info",
            category: "operation",
            outcome: "success",
        });
    });
    const httpShutdown = createGracefulShutdown({
        server,
        timeoutMs: shutdownTimeoutMs,
    });
    let closing;
    const shutdown = {
        get closing() {
            return httpShutdown.closing;
        },
        close(reason) {
            closing ??= httpShutdown.close(reason).then(() => {
                logger.emit({
                    event: "service.shutdown",
                    level: "info",
                    category: "operation",
                    outcome: "success",
                });
            });
            return closing;
        },
    };
    let disposeShutdownSignals;
    try {
        disposeShutdownSignals = bindShutdownSignals({
            names: shutdownSignalNames,
            onError: onShutdownError,
            shutdown,
            signals: options.shutdownSignals ?? process,
        });
    }
    catch (error) {
        rollbackFailedServerStartup(server, error, onShutdownError, logger);
    }
    return Object.freeze({
        ...application,
        disposeShutdownSignals,
        server,
        shutdown,
    });
}
function requireStaticSiteApplication(value) {
    if ((typeof value !== "object" && typeof value !== "function") ||
        value === null) {
        throw new Error("The Express-compatible factory must return an application.");
    }
    const candidate = value;
    for (const method of ["disable", "get", "listen", "set", "use"]) {
        if (typeof candidate[method] !== "function") {
            throw new Error(`The Express-compatible application must provide ${method}().`);
        }
    }
    return value;
}
function rollbackFailedServerStartup(server, registrationError, onError, logger) {
    try {
        server.close((closeError) => {
            if (!closeError)
                return;
            try {
                onError(closeError);
            }
            catch (reportingError) {
                logger.emit({
                    event: "service.rollback",
                    level: "error",
                    category: "operation",
                    outcome: "failure",
                    error: new AggregateError([closeError, reportingError]),
                });
                process.exitCode = 1;
            }
        });
    }
    catch (closeError) {
        throw new AggregateError([registrationError, closeError], "Static-site signal binding failed and its listener rollback could not start.");
    }
    throw registrationError;
}
function serveStaticSitePage(browserServing, request, response) {
    const snapshot = browserServing.browserDirForRequest(request);
    const indexHtml = join(snapshot, "index.html");
    if (!isSafeFile(snapshot, indexHtml)) {
        response.setHeader("Cache-Control", "no-store");
        response
            .status(503)
            .type("text/plain")
            .send("Build missing. Run the build first.");
        return;
    }
    const entry = resolvePrerenderedEntry(snapshot, request.path ?? request.url ?? "/");
    response.setHeader("Cache-Control", "no-cache");
    if (entry && isSafeFile(snapshot, entry)) {
        browserServing.sendFileForRequest(request, response, entry);
        return;
    }
    response.status(404);
    for (const fallbackName of ["404.html", "index.csr.html", "index.html"]) {
        const fallback = join(snapshot, fallbackName);
        if (isSafeFile(snapshot, fallback)) {
            browserServing.sendFileForRequest(request, response, fallback);
            return;
        }
    }
    throw new Error("The browser output has no safe fallback document.");
}
function isSafeFile(root, candidate) {
    if (!isContainedPath(root, candidate))
        return false;
    const entry = lstatIfPresent(candidate);
    if (!entry?.isFile() || entry.isSymbolicLink())
        return false;
    return isContainedPath(root, realpathSync(candidate));
}
function validateRepositoryRoot(repoRoot) {
    if (typeof repoRoot !== "string" ||
        !repoRoot ||
        repoRoot !== repoRoot.trim() ||
        /[\u0000-\u001f\u007f]/.test(repoRoot)) {
        throw new Error("Static-site repository root must be a safe non-empty path.");
    }
    const resolved = resolve(repoRoot);
    const entry = lstatIfPresent(resolved);
    if (!entry?.isDirectory() || entry.isSymbolicLink()) {
        throw new Error(`Static-site repository root is missing or unsafe: ${resolved}`);
    }
    return realpathSync(resolved);
}
function resolveConfiguredPath(repoRoot, value, label) {
    if (typeof value !== "string" ||
        !value ||
        value !== value.trim() ||
        /[\u0000-\u001f\u007f]/.test(value)) {
        throw new Error(`${label} must be a safe non-empty path.`);
    }
    return isAbsolute(value) ? resolve(value) : resolve(repoRoot, value);
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
