export type HeaderValue = string | number | readonly string[];
export interface HttpRequest {
    readonly ip?: string | undefined;
    readonly socket?: {
        readonly remoteAddress?: string | undefined;
    } | undefined;
    readonly method?: string | undefined;
    readonly path?: string | undefined;
    readonly url?: string | undefined;
    readonly originalUrl?: string | undefined;
    readonly headers?: Readonly<Record<string, string | readonly string[] | undefined>> | undefined;
    requestId?: string | undefined;
}
export interface HttpResponse {
    readonly headersSent?: boolean | undefined;
    destroy(): unknown;
    getHeader?(name: string): HeaderValue | undefined;
    setHeader(name: string, value: HeaderValue): unknown;
    status(code: number): this;
    type(contentType: string): this;
    json(body: unknown): unknown;
    send(body?: unknown): unknown;
}
export type NextFunction = (error?: unknown) => void;
export type Middleware = (request: HttpRequest, response: HttpResponse, next: NextFunction) => void | Promise<void>;
export interface HardenableApplication {
    set(name: string, value: unknown): unknown;
    disable(name: string): unknown;
}
export interface CloseableServer {
    close(callback: (error?: Error) => void): unknown;
    closeAllConnections?(): void;
}
export interface SignalSource {
    once(signal: string, listener: () => void): unknown;
    off(signal: string, listener: () => void): unknown;
}
/** Decode one safe absolute request pathname using the static-serving path contract. */
export declare function decodeSafeRequestPathname(requestPath: string): string | undefined;
//# sourceMappingURL=http.d.ts.map