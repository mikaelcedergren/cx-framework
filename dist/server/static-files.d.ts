import { type Environment } from "./configuration.js";
import { type BrowserDirectorySelection } from "./browser-releases.js";
import { type HeaderValue, type HttpRequest, type NextFunction } from "./http.js";
import { setStaticCacheHeaders } from "./security.js";
export interface SendFileOptions {
    readonly dotfiles: "deny";
    readonly root: string;
}
export interface StaticFileResponse {
    getHeader?(name: string): HeaderValue | undefined;
    setHeader(name: string, value: HeaderValue): unknown;
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
export declare function retainedReleaseAssetMiddleware({ repoRoot, }: {
    repoRoot: string;
}): StaticFileMiddleware;
//# sourceMappingURL=static-files.d.ts.map