import type { HardenableApplication, HeaderValue, HttpResponse, Middleware } from "./http.js";
export declare const ONE_YEAR_SECONDS = 31536000;
export declare const HASHED_ASSET: RegExp;
export declare function hardenApplication<T extends HardenableApplication>(application: T): T;
export declare function securityHeaders({ frameOptions, }?: {
    frameOptions?: "DENY" | "SAMEORIGIN";
}): Middleware;
export declare function noindexHeader(paths?: readonly string[]): Middleware;
export declare function noStoreHeader(): Middleware;
export declare function setStaticCacheHeaders(response: Pick<HttpResponse, "getHeader" | "setHeader">, filePath: string): void;
export declare function hasNoStoreCacheDirective(value: HeaderValue | undefined): boolean;
export declare function isAssetRequestPath(requestPath: string): boolean;
export declare function missingAssetMiddleware(): Middleware;
//# sourceMappingURL=security.d.ts.map