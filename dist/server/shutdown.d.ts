import type { CloseableServer, SignalSource } from "./http.js";
export interface GracefulShutdown {
    readonly closing: boolean;
    close(reason?: string): Promise<void>;
}
export declare function createGracefulShutdown({ server, timeoutMs, onTimeout, }: {
    server: CloseableServer;
    timeoutMs?: number;
    onTimeout?: (reason: string) => void;
}): GracefulShutdown;
export declare function bindShutdownSignals({ signals, shutdown, names, onError, }: {
    signals: SignalSource;
    shutdown: GracefulShutdown;
    names?: readonly string[];
    onError: (error: unknown) => void;
}): () => void;
export declare function validateShutdownSignalNames(names?: readonly string[]): readonly string[];
//# sourceMappingURL=shutdown.d.ts.map