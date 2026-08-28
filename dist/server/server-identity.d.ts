import { type Environment } from "./configuration.js";
import type { Middleware } from "./http.js";
export declare const SERVER_IDENTITY_PATH = "/cx-server.json";
export declare const SERVER_IDENTITY_ENVIRONMENT_KEY = "CX_SERVER_RELEASE_IDENTITY_FILE";
export declare const MAX_SERVER_IDENTITY_BYTES: number;
export declare const MAX_SERVER_RELEASE_ARTIFACT_BYTES: number;
export declare const MAX_SERVER_RELEASE_ARTIFACT_ENTRIES = 100000;
export declare const MAX_SERVER_RELEASE_WORKERS = 64;
export interface ServerReleaseWorkerIdentity {
    readonly entrypoint: string;
    readonly key: string;
}
export interface ServerReleaseIdentity {
    readonly schemaVersion: 1;
    readonly releaseId: string;
    readonly serverBuildId: string;
    readonly revision: string;
    readonly sourceFingerprint: string;
    readonly sourceDirty: boolean;
    readonly artifactDigest: string;
    readonly createdAt: string;
    readonly entrypoint: string;
    readonly workers: readonly ServerReleaseWorkerIdentity[];
    readonly nodeMajor: 26;
    readonly artifactFiles: number;
    readonly artifactBytes: number;
}
export interface ServerReleaseArtifactDeclaration {
    readonly entrypoint: string;
    readonly workers: readonly ServerReleaseWorkerIdentity[];
}
export interface LoadServerReleaseIdentityOptions {
    readonly environment?: Environment;
    readonly identityFile?: string;
    readonly required?: boolean;
}
export interface AcquireServerReleaseIdentityFileLeaseOptions {
    readonly environment?: Environment;
    readonly identity: ServerReleaseIdentity;
    readonly identityFile?: string;
}
/**
 * An open descriptor for the exact immutable identity file parsed during startup.
 * The descriptor is deliberately retained until close so an external supervisor can prove which
 * release a listener-free process is still executing after the mutable release pointer moves.
 */
export interface ServerReleaseIdentityFileLease {
    readonly closed: boolean;
    readonly identityFile: string;
    close(): void;
}
export declare function parseServerReleaseArtifactDeclaration(value: unknown): ServerReleaseArtifactDeclaration;
export declare function parseServerReleaseIdentity(value: unknown): ServerReleaseIdentity;
export declare function loadServerReleaseIdentity({ environment, identityFile, required, }?: LoadServerReleaseIdentityOptions): ServerReleaseIdentity | undefined;
/**
 * Reopen and retain the exact identity file that produced an already-pinned release identity.
 * Parsed lookalikes are rejected: the expected object must originate from
 * loadServerReleaseIdentity(), and its path, inode snapshot, bytes, and exact parsed identity must
 * all still match when the lease is acquired.
 */
export declare function acquireServerReleaseIdentityFileLease({ environment, identity, identityFile, }: AcquireServerReleaseIdentityFileLeaseOptions): ServerReleaseIdentityFileLease;
export declare function serverReleaseIdentityMiddleware(identity: ServerReleaseIdentity): Middleware;
//# sourceMappingURL=server-identity.d.ts.map