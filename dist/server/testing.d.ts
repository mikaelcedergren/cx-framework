export type SyntheticBrowserReleaseFile = string | Uint8Array;
export interface SyntheticBrowserReleaseFixtureOptions {
    /** ISO timestamp stored in the synthetic reader metadata. */
    readonly createdAt?: string;
    /** Additional regular files placed below the synthetic browser root. */
    readonly files?: Readonly<Record<string, SyntheticBrowserReleaseFile>>;
    /** Unique immutable release identity for this disposable repository. */
    readonly releaseId: string;
    /** Existing disposable repository root owned by the calling test. */
    readonly repoRoot: string;
}
export interface SyntheticBrowserReleaseFixture {
    readonly browserDir: string;
    readonly buildId: string;
    readonly canonicalBrowserDir: string;
    readonly createdAtMs: number;
    readonly releaseId: string;
}
/**
 * Create and activate one immutable browser release for reader-side server tests.
 *
 * This deliberately implements only the on-disk contract consumed by
 * `createBrowserServing`. It does not build, publish, retain, or verify a real
 * production artifact and must be used only with a caller-owned disposable root.
 */
export declare function activateSyntheticBrowserReleaseFixture({ createdAt, files, releaseId, repoRoot, }: SyntheticBrowserReleaseFixtureOptions): SyntheticBrowserReleaseFixture;
export interface ServerProbe {
    body?: unknown;
    headers?: Readonly<Record<string, string>>;
    method?: string;
    path: string;
    status: number;
}
export interface ServerProbeResult {
    path: string;
    status: number;
}
export declare function probeServer(origin: string, probes: readonly ServerProbe[], fetchImplementation?: typeof fetch): Promise<ServerProbeResult[]>;
//# sourceMappingURL=testing.d.ts.map