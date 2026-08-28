export interface HttpListenApplication<Server> {
    listen(port: number, host: string, callback: (error?: Error) => void): Server;
}
export interface HttpListenAddress {
    readonly host: string;
    readonly port: number;
}
/**
 * Resolves only after an Express-compatible application has successfully bound
 * its listener. Express 5 reports asynchronous bind failures to the listen
 * callback, so callers must await this result before announcing readiness or
 * installing work that assumes the server is reachable.
 */
export declare function listenHttpApplication<Server>(application: HttpListenApplication<Server>, address: HttpListenAddress): Promise<Server>;
//# sourceMappingURL=listen.d.ts.map