import { lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  localBindHost,
  nodeEnvironmentValue,
  portEnvironmentValue,
  releaseValidationEnvironmentValue,
  type Environment,
  type NodeEnvironment,
} from "./configuration.js";
import { apiNotFoundMiddleware, jsonErrorMiddleware } from "./errors.js";
import { healthMiddleware } from "./health.js";
import {
  createRuntimeLogger,
  type LogSink,
  type RuntimeLogger,
} from "./logging.js";
import type {
  CloseableServer,
  HardenableApplication,
  HttpRequest,
  HttpResponse,
  Middleware,
  NextFunction,
  SignalSource,
} from "./http.js";
import { requestIdMiddleware } from "./request-id.js";
import { assertServerProcessRole } from "./process-role.js";
import {
  loadProductManifestFile,
  type LoadedProductManifest,
  type ProductManifest,
} from "./product-manifest.js";
import {
  hardenApplication,
  missingAssetMiddleware,
  noindexHeader,
  securityHeaders,
} from "./security.js";
import {
  loadServerReleaseIdentity,
  SERVER_IDENTITY_PATH,
  serverReleaseIdentityMiddleware,
  type ServerReleaseIdentity,
} from "./server-identity.js";
import {
  bindShutdownSignals,
  createGracefulShutdown,
  type GracefulShutdown,
  validateShutdownSignalNames,
} from "./shutdown.js";
import {
  assertBrowserServingForStartup,
  createBrowserServing,
  resolveBrowserDirectoryOverride,
  retainedReleaseAssetMiddleware,
  resolvePrerenderedEntry,
  staticFileOptions,
  type BrowserServing,
  type StaticFileFactory,
  type StaticFileMiddleware,
  type StaticFileResponse,
} from "./static-files.js";
import { assertTimerDelayMilliseconds } from "./timer.js";

export type StaticSiteManifest = Omit<
  ProductManifest,
  "capabilities" | "frontend" | "profile"
> & {
  readonly profile: "static-site";
  readonly frontend: ProductManifest["frontend"] & {
    readonly rendering: "ssg";
  };
  readonly capabilities: ProductManifest["capabilities"] & {
    readonly authentication: "none";
    readonly persistentData: "none";
    readonly backgroundWork: "none" | "build-time";
  };
};

interface LoadedStaticSiteManifest extends Omit<
  LoadedProductManifest,
  "manifest"
> {
  readonly manifest: StaticSiteManifest;
}

export interface StaticSiteRequest extends HttpRequest {}

export interface StaticSiteResponse extends HttpResponse, StaticFileResponse {}

export type StaticSiteMiddleware = (
  request: StaticSiteRequest,
  response: StaticSiteResponse,
  next: NextFunction,
) => unknown;

export type StaticSiteErrorMiddleware = (
  error: unknown,
  request: StaticSiteRequest,
  response: StaticSiteResponse,
  next: NextFunction,
) => unknown;

export type StaticSiteHandler =
  | Middleware
  | StaticFileMiddleware
  | StaticSiteMiddleware
  | StaticSiteErrorMiddleware;

export interface StaticSiteApplication extends HardenableApplication {
  get(path: string | RegExp, handler: StaticSiteHandler): unknown;
  listen(
    port: number,
    host: string,
    callback: (error?: Error) => void,
  ): CloseableServer;
  use(handler: StaticSiteHandler): unknown;
  use(path: string, handler: StaticSiteHandler): unknown;
}

export interface StaticSiteExpress extends StaticFileFactory {
  (): unknown;
}

export type CompressionFactory = () => unknown;

export interface StaticSiteConfiguration {
  readonly appName: string;
  readonly browserDir: string;
  readonly browserDirOverride?: string;
  readonly host: string;
  readonly manifest: StaticSiteManifest;
  readonly manifestFile: string;
  readonly nodeEnvironment: NodeEnvironment;
  readonly port: number;
  readonly releaseValidation: boolean;
  readonly repoRoot: string;
  readonly serverIdentity?: ServerReleaseIdentity;
}

export interface StaticSiteOptions {
  readonly appName?: string;
  readonly browserDir?: string;
  readonly browserDirOverride?: string;
  readonly compression: CompressionFactory;
  readonly defaultPort?: number;
  readonly entrypointUrl: string | URL;
  readonly environment?: Environment;
  readonly express: StaticSiteExpress;
  readonly frameOptions?: "DENY" | "SAMEORIGIN";
  readonly manifestFile: string;
  readonly noindexPaths?: readonly string[];
  readonly logSink?: LogSink;
  readonly trustedProxyAddress?: "127.0.0.1" | "::1";
  readonly repoRoot: string;
  readonly serverIdentityFile?: string;
}

export interface StaticSiteServerOptions extends StaticSiteOptions {
  readonly onShutdownError?: (error: unknown) => void;
  readonly shutdownSignalNames?: readonly string[];
  readonly shutdownSignals?: SignalSource;
  readonly shutdownTimeoutMs?: number;
}

export interface StaticSiteApplicationResult {
  readonly app: StaticSiteApplication;
  readonly browserServing: BrowserServing;
  readonly configuration: StaticSiteConfiguration;
  readonly logger: RuntimeLogger;
}

export interface StaticSiteServerResult extends StaticSiteApplicationResult {
  readonly disposeShutdownSignals: () => void;
  readonly server: CloseableServer;
  readonly shutdown: GracefulShutdown;
}

export function loadStaticSiteManifest(
  manifestFile: string,
): StaticSiteManifest {
  return loadStaticSiteManifestFile(manifestFile).manifest;
}

function loadStaticSiteManifestFile(
  manifestFile: string,
): LoadedStaticSiteManifest {
  const loaded = loadProductManifestFile(manifestFile);
  const { capabilities, frontend, profile } = loaded.manifest;
  if (profile !== "static-site") {
    throw new Error(
      "cx-product.json must declare the web static-site profile.",
    );
  }
  if (frontend.framework !== "angular" || frontend.rendering !== "ssg") {
    throw new Error(
      "cx-product.json static sites must use Angular SSG rendering.",
    );
  }
  if (
    capabilities.authentication !== "none" ||
    capabilities.persistentData !== "none" ||
    !["none", "build-time"].includes(capabilities.backgroundWork)
  ) {
    throw new Error(
      "cx-product.json static sites cannot own runtime authentication, data, or background work.",
    );
  }
  return loaded as LoadedStaticSiteManifest;
}

export function resolveStaticSiteConfiguration({
  appName,
  browserDir,
  browserDirOverride,
  defaultPort,
  environment = process.env,
  manifestFile,
  repoRoot,
  serverIdentityFile,
}: Pick<
  StaticSiteOptions,
  | "appName"
  | "browserDir"
  | "browserDirOverride"
  | "defaultPort"
  | "environment"
  | "manifestFile"
  | "repoRoot"
  | "serverIdentityFile"
>): StaticSiteConfiguration {
  const nodeEnvironment = nodeEnvironmentValue(environment);
  const releaseValidation = releaseValidationEnvironmentValue(environment);
  const root = validateRepositoryRoot(repoRoot);
  const loadedManifest = loadStaticSiteManifestFile(manifestFile);
  const resolvedManifestFile = loadedManifest.manifestFile;
  const manifest = loadedManifest.manifest;
  const configuredAppName = appName ?? manifest.id;
  if (
    !configuredAppName ||
    configuredAppName !== configuredAppName.trim() ||
    /[\u0000-\u001f\u007f]/.test(configuredAppName)
  ) {
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

export function createStaticSiteApplication(
  options: StaticSiteOptions,
): StaticSiteApplicationResult {
  if (!options || typeof options !== "object") {
    throw new Error("Static-site options are required.");
  }
  if (!options.express || typeof options.express !== "function") {
    throw new Error(
      "Static-site entrypoint requires an Express-compatible factory.",
    );
  }
  if (typeof options.compression !== "function") {
    throw new Error("Static-site compression must be a middleware factory.");
  }
  if (!(
    typeof options.entrypointUrl === "string" ||
    options.entrypointUrl instanceof URL
  )) {
    throw new Error("Static-site entrypointUrl is required.");
  }
  const noindexPaths = options.noindexPaths ?? [];
  const noindex = noindexHeader(noindexPaths);
  const configuration = resolveStaticSiteConfiguration(options);
  const logger = createRuntimeLogger({
    identity: {
      service: configuration.manifest.id,
      environment: configuration.nodeEnvironment,
      executionScope:
        (options.environment ?? process.env)["CX_EXECUTION_SCOPE"] ??
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
  app.use(
    requestIdMiddleware(
      options.trustedProxyAddress === undefined
        ? {}
        : { trustedProxyAddress: options.trustedProxyAddress },
    ),
  );
  app.use(securityHeaders({ frameOptions: options.frameOptions ?? "DENY" }));
  if (noindexPaths.length > 0) app.use(noindex);
  const compressionMiddleware = options.compression();
  if (typeof compressionMiddleware !== "function") {
    throw new Error("Static-site compression must return middleware.");
  }
  app.use(compressionMiddleware as StaticSiteHandler);
  if (configuration.serverIdentity) {
    app.get(
      SERVER_IDENTITY_PATH,
      serverReleaseIdentityMiddleware(configuration.serverIdentity),
    );
  }
  app.get(
    "/healthz",
    healthMiddleware(configuration.appName, configuration.port),
  );
  app.use("/api", apiNotFoundMiddleware());
  app.use(browserServing.staticMiddleware(staticFileOptions()));
  if (browserServing.useReleaseHistory) {
    app.use(
      retainedReleaseAssetMiddleware({ repoRoot: configuration.repoRoot }),
    );
  }
  app.use(missingAssetMiddleware());
  app.get(
    /.*/,
    (
      request: StaticSiteRequest,
      response: StaticSiteResponse,
      next: NextFunction,
    ) => {
      try {
        serveStaticSitePage(browserServing, request, response);
      } catch (error) {
        next(error);
      }
    },
  );
  app.use(jsonErrorMiddleware({ logger }));

  return Object.freeze({ app, browserServing, configuration, logger });
}

export function createStaticSiteServer(
  options: StaticSiteServerOptions,
): StaticSiteServerResult {
  const shutdownTimeoutMs = options.shutdownTimeoutMs ?? 10_000;
  assertTimerDelayMilliseconds(
    shutdownTimeoutMs,
    "Static-site shutdown timeout",
  );
  const shutdownSignalNames = validateShutdownSignalNames(
    options.shutdownSignalNames,
  );
  const application = createStaticSiteApplication(options);
  const { host, port } = application.configuration;
  const { logger } = application;
  const onShutdownError = (error: unknown): void => {
    logger.emit({
      event: "service.shutdown",
      level: "error",
      category: "operation",
      outcome: "failure",
      error,
    });
    if (options.onShutdownError) options.onShutdownError(error);
    else process.exitCode = 1;
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
      throw error;
    }
    logger.emit({
      event: "service.listen",
      level: "info",
      category: "operation",
      outcome: "success",
    });
  });
  const shutdown = createGracefulShutdown({
    server,
    timeoutMs: shutdownTimeoutMs,
  });
  let disposeShutdownSignals: () => void;
  try {
    disposeShutdownSignals = bindShutdownSignals({
      names: shutdownSignalNames,
      onError: onShutdownError,
      shutdown,
      signals: options.shutdownSignals ?? process,
    });
  } catch (error) {
    rollbackFailedServerStartup(server, error, onShutdownError, logger);
  }
  return Object.freeze({
    ...application,
    disposeShutdownSignals,
    server,
    shutdown,
  });
}

function requireStaticSiteApplication(value: unknown): StaticSiteApplication {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null
  ) {
    throw new Error(
      "The Express-compatible factory must return an application.",
    );
  }
  const candidate = value as Readonly<Record<string, unknown>>;
  for (const method of ["disable", "get", "listen", "set", "use"] as const) {
    if (typeof candidate[method] !== "function") {
      throw new Error(
        `The Express-compatible application must provide ${method}().`,
      );
    }
  }
  return value as StaticSiteApplication;
}

function rollbackFailedServerStartup(
  server: CloseableServer,
  registrationError: unknown,
  onError: (error: unknown) => void,
  logger: RuntimeLogger,
): never {
  try {
    server.close((closeError) => {
      if (!closeError) return;
      try {
        onError(closeError);
      } catch (reportingError) {
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
  } catch (closeError) {
    throw new AggregateError(
      [registrationError, closeError],
      "Static-site signal binding failed and its listener rollback could not start.",
    );
  }
  throw registrationError;
}

function serveStaticSitePage(
  browserServing: BrowserServing,
  request: StaticSiteRequest,
  response: StaticSiteResponse,
): void {
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

  const entry = resolvePrerenderedEntry(
    snapshot,
    request.path ?? request.url ?? "/",
  );
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

function isSafeFile(root: string, candidate: string): boolean {
  if (!isContainedPath(root, candidate)) return false;
  const entry = lstatIfPresent(candidate);
  if (!entry?.isFile() || entry.isSymbolicLink()) return false;
  return isContainedPath(root, realpathSync(candidate));
}

function validateRepositoryRoot(repoRoot: string): string {
  if (
    typeof repoRoot !== "string" ||
    !repoRoot ||
    repoRoot !== repoRoot.trim() ||
    /[\u0000-\u001f\u007f]/.test(repoRoot)
  ) {
    throw new Error(
      "Static-site repository root must be a safe non-empty path.",
    );
  }
  const resolved = resolve(repoRoot);
  const entry = lstatIfPresent(resolved);
  if (!entry?.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(
      `Static-site repository root is missing or unsafe: ${resolved}`,
    );
  }
  return realpathSync(resolved);
}

function resolveConfiguredPath(
  repoRoot: string,
  value: string,
  label: string,
): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} must be a safe non-empty path.`);
  }
  return isAbsolute(value) ? resolve(value) : resolve(repoRoot, value);
}

function isContainedPath(parent: string, candidate: string): boolean {
  const contained = relative(resolve(parent), resolve(candidate));
  return (
    contained !== "" &&
    contained !== ".." &&
    !contained.startsWith(`..${sep}`) &&
    !isAbsolute(contained)
  );
}

function lstatIfPresent(
  candidate: string,
): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(candidate);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
