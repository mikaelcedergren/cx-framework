export declare const DEFAULT_BROWSER_ARTIFACT_MAX_BYTES: number;
export declare const DEFAULT_BROWSER_ARTIFACT_MAX_ENTRIES = 100000;
export declare const DEFAULT_BROWSER_ARTIFACT_MAX_DEPTH = 64;
export declare const DEFAULT_BROWSER_ARTIFACT_MAX_FILE_BYTES: number;
export interface BrowserReleasePaths {
    readonly activation: string;
    readonly currentBrowser: string;
    readonly releases: string;
    readonly repoRoot: string;
    readonly root: string;
}
export interface BrowserRelease {
    readonly browserDir: string;
    readonly canonicalBrowserDir: string;
    readonly createdAtMs: number;
    readonly releaseId: string;
}
export type BrowserDirectoryMode = "active-release" | "legacy" | "missing" | "override";
export interface BrowserDirectorySelection {
    readonly browserDir: string;
    readonly mode: BrowserDirectoryMode;
    readonly repoRoot?: string;
    readonly useReleaseHistory: boolean;
}
export interface RetainedBrowserAsset {
    readonly canonicalBrowserDir: string;
    readonly filePath: string;
    readonly relativePath: string;
    readonly releaseId: string;
}
export interface BrowserArtifactManifestEntry {
    readonly bytes?: number;
    readonly digest?: string;
    readonly mode: string;
    readonly path: string;
    readonly type: "directory" | "file";
}
export interface BrowserArtifactValidation {
    readonly artifactBytes: number;
    readonly artifactDigest: string;
    readonly artifactEntries: number;
    readonly browserFiles: number;
    readonly htmlFiles: number;
    readonly manifest: readonly BrowserArtifactManifestEntry[];
    readonly totalBytes: number;
}
export interface ValidateBrowserArtifactOptions {
    readonly expectedBuildId?: string;
    readonly maxArtifactBytes?: number;
    readonly maxDepth?: number;
    readonly maxEntries?: number;
    readonly maxFileBytes?: number;
}
/**
 * Validate and fingerprint one complete browser artifact with the canonical v2 algorithm.
 *
 * The build-info file is verified as part of the bounded tree but excluded from the artifact
 * identity because it contains that identity. Every HTML marker is normalized back to the one
 * source placeholder before hashing. Paths are sorted by their UTF-8 bytes, and entry type, final
 * POSIX mode, canonical size, and content digest all participate in the result.
 */
export declare function validateBrowserArtifact(browserDir: string, { expectedBuildId, maxArtifactBytes, maxEntries, maxDepth, maxFileBytes, }?: ValidateBrowserArtifactOptions): BrowserArtifactValidation;
export declare function browserReleasePaths(repoRoot: string): BrowserReleasePaths;
export declare function resolveBrowserDirectory({ repoRoot, legacyBrowserDir, browserDirOverride, }: {
    repoRoot: string;
    legacyBrowserDir: string;
    browserDirOverride?: string;
}): BrowserDirectorySelection;
export declare function browserDirectoryForSnapshot(selection: BrowserDirectorySelection): string;
export declare function readActiveBrowserRelease(repoRoot: string): BrowserRelease;
/** Validate one already-resolved immutable release browser without rereading the active pointer. */
export declare function readBrowserReleaseSnapshot(repoRoot: string, browserDir: string): BrowserRelease;
export declare function listBrowserReleases(repoRoot: string): BrowserRelease[];
export type RetainedBrowserAssetResolver = (requestPath: string) => RetainedBrowserAsset | undefined;
/** Create one bounded resolver for a server middleware instance. */
export declare function createRetainedBrowserAssetResolver(repoRoot: string): RetainedBrowserAssetResolver;
export declare function findRetainedBrowserAsset(repoRoot: string, requestPath: string): RetainedBrowserAsset | undefined;
export declare function validateBrowserDirectory(browserDir: string): string;
export declare function canonicalizeBrowserHtmlBuildIdentity(source: string, expectedBuildId: string, file: string): string;
/** Stamp one real, direct-child-of-head build marker from the source placeholder. */
export declare function stampBrowserHtmlBuildIdentity(source: string, buildId: string, file: string): string;
/** Prove one real, direct-child-of-head build marker without changing the HTML. */
export declare function assertBrowserHtmlBuildIdentity(source: string, expectedBuildId: string, file: string): void;
//# sourceMappingURL=browser-releases.d.ts.map