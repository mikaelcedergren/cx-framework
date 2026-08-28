import { type Environment } from "./configuration.js";
import { type ServerReleaseIdentity } from "./server-identity.js";
export declare const SERVER_WORKER_READINESS_TYPE = "cx-server-worker-ready";
export interface ServerWorkerReadiness {
    readonly schemaVersion: 1;
    readonly type: typeof SERVER_WORKER_READINESS_TYPE;
    readonly productId: string;
    readonly releaseId: string;
    readonly serverBuildId: string;
    readonly workerKey: string;
    readonly entrypoint: string;
}
export interface CreateServerWorkerReadinessOptions {
    readonly identity: ServerReleaseIdentity;
    readonly productId: string;
    readonly workerKey: string;
}
export interface ServerWorkerReadinessChannel {
    readonly connected?: boolean;
    ref(): void;
    send(message: ServerWorkerReadiness, callback: (error: Error | null) => void): boolean;
    unref(): void;
}
export interface SignalServerWorkerReadinessOptions {
    readonly channel?: ServerWorkerReadinessChannel;
    readonly environment?: Environment;
}
export interface AcquireServerWorkerReadinessLeaseOptions {
    readonly environment?: Environment;
    readonly identity: ServerReleaseIdentity | undefined;
    readonly workerKey: string;
}
/** A production worker's open proof of the exact release identity it initialized. */
export interface ServerWorkerReadinessLease {
    readonly closed: boolean;
    readonly entrypoint: string;
    readonly identityFile: string;
    readonly releaseId: string;
    readonly serverBuildId: string;
    readonly workerKey: string;
    close(): void;
}
export declare function createServerWorkerReadiness({ identity, productId, workerKey, }: CreateServerWorkerReadinessOptions): ServerWorkerReadiness;
/**
 * Acquire the ordinary production worker's readiness lease after its real runtime initializes.
 * Development returns no lease, and isolated release validation remains IPC-only. Production
 * reopens the configured release identity, proves it is the exact startup snapshot, and retains
 * that read-only descriptor until the idempotent close handle is invoked.
 */
export declare function acquireServerWorkerReadinessLease({ environment, identity, workerKey, }: AcquireServerWorkerReadinessLeaseOptions): ServerWorkerReadinessLease | undefined;
export declare function parseServerWorkerReadiness(value: unknown): ServerWorkerReadiness;
/**
 * Send one readiness receipt only inside shared release validation. Ordinary production and
 * development workers have no IPC parent, so the same startup path remains portable.
 */
export declare function signalServerWorkerReadiness(readiness: ServerWorkerReadiness, { channel, environment, }?: SignalServerWorkerReadinessOptions): Promise<boolean>;
//# sourceMappingURL=worker-readiness.d.ts.map