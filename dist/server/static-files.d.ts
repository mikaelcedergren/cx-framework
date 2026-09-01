import { type Environment } from "./configuration.js";
import { type BrowserDirectorySelection } from "./browser-releases.js";
import { type HttpRequest, type HttpResponse, type NextFunction } from "./http.js";
import { setStaticCacheHeaders } from "./security.js";
export interface SendFileOptions {
    readonly dotfiles: "deny";
    readonly root: string;
}
export interface StaticFileResponse extends HttpResponse {
    sendFile(filePath: string, options: SendFileOptions): unknown;
}
export type StaticFileMiddleware = (request: HttpRequest, response: StaticFileResponse, next: NextFunction) => unknown;
export type StaticFileOptions = Readonly<Record<string, unknown>> & {
    readonly dotfiles: "ignore";
    readonly index: false;
    readonly redirect: false;
    readonly setHeaders: typeof setStaticCacheHeaders;
};
export interface StaticFileFactory {
    static(root: string, options?: StaticFileOptions): unknown;
}
export interface BrowserServing {
    readonly browserDir: string;
    readonly mode: BrowserDirectorySelection["mode"];
    readonly useReleaseHistory: boolean;
    assertAvailable(): string;
    browserDirForRequest(request: object): string;
    sendFileForRequest(request: object, response: StaticFileResponse, filePath: string): unknown;
    staticMiddleware(options?: StaticFileOptions, subdirectory?: string): StaticFileMiddleware;
}
export interface SinglePageApplicationMiddlewareOptions {
    readonly apiPathPrefix?: string;
    readonly browserServing: BrowserServing;
    readonly entryFile?: string;
    readonly repoRoot: string;
}
/** Require a validated browser snapshot only for an ordinary production web process. */
export declare function assertBrowserServingForStartup({ browserServing, environment, }: {
    readonly browserServing: BrowserServing;
    readonly environment: Environment;
}): string | undefined;
/** Resolve the one browser override while enforcing its development/validation-only boundary. */
export declare function resolveBrowserDirectoryOverride({ browserDirOverride, environment, repoRoot, }: {
    readonly browserDirOverride?: string;
    readonly environment: Environment;
    readonly repoRoot: string;
}): string | undefined;
export declare function staticFileOptions(overrides?: Readonly<Record<string, unknown>>): StaticFileOptions;
export declare function resolvePrerenderedEntry(browserDir: string, requestPath: string): string | undefined;
export declare function createBrowserServing({ express, repoRoot, defaultBrowserDir, browserDirOverride, }: {
    express: StaticFileFactory;
    repoRoot: string;
    defaultBrowserDir: string;
    browserDirOverride?: string;
}): BrowserServing;
/**
 * Compose the canonical browser static -> retained asset -> missing asset -> SPA fallback chain.
 *
 * Callers mount the returned middleware in order, then mount their JSON error middleware. Every
 * synchronous browser-resolution or send-file failure is forwarded through `next(error)` so an
 * Express default HTML error page can never escape a product's API/error contract.
 */
export declare function createSinglePageApplicationMiddlewareStack({ apiPathPrefix, browserServing, entryFile, repoRoot, }: SinglePageApplicationMiddlewareOptions): readonly StaticFileMiddleware[];
export declare function retainedReleaseAssetMiddleware({ repoRoot, }: {
    repoRoot: string;
}): StaticFileMiddleware;
//# sourceMappingURL=static-files.d.ts.map