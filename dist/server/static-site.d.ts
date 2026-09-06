import { type Environment, type NodeEnvironment } from "./configuration.js";
import { type LogSink, type RuntimeLogger } from "./logging.js";
import type { CloseableServer, HardenableApplication, HttpRequest, HttpResponse, Middleware, NextFunction, SignalSource } from "./http.js";
import { type ProductManifest } from "./product-manifest.js";
import { type ServerReleaseIdentity } from "./server-identity.js";
import { type GracefulShutdown } from "./shutdown.js";
import { type BrowserServing, type StaticFileFactory, type StaticFileMiddleware, type StaticFileResponse } from "./static-files.js";
export type StaticSiteManifest = Omit<ProductManifest, "capabilities" | "frontend" | "profile"> & {
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
export interface StaticSiteRequest extends HttpRequest {
}
export interface StaticSiteResponse extends HttpResponse, StaticFileResponse {
}
export type StaticSiteMiddleware = (request: StaticSiteRequest, response: StaticSiteResponse, next: NextFunction) => unknown;
export type StaticSiteErrorMiddleware = (error: unknown, request: StaticSiteRequest, response: StaticSiteResponse, next: NextFunction) => unknown;
export type StaticSiteHandler = Middleware | StaticFileMiddleware | StaticSiteMiddleware | StaticSiteErrorMiddleware;
export interface StaticSiteApplication extends HardenableApplication {
    get(path: string | RegExp, handler: StaticSiteHandler): unknown;
    listen(port: number, host: string, callback: (error?: Error) => void): CloseableServer;
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
export declare function loadStaticSiteManifest(manifestFile: string): StaticSiteManifest;
export declare function resolveStaticSiteConfiguration({ appName, browserDir, browserDirOverride, defaultPort, environment, manifestFile, repoRoot, serverIdentityFile, }: Pick<StaticSiteOptions, "appName" | "browserDir" | "browserDirOverride" | "defaultPort" | "environment" | "manifestFile" | "repoRoot" | "serverIdentityFile">): StaticSiteConfiguration;
export declare function createStaticSiteApplication(options: StaticSiteOptions): StaticSiteApplicationResult;
export declare function createStaticSiteServer(options: StaticSiteServerOptions): StaticSiteServerResult;
//# sourceMappingURL=static-site.d.ts.map