import { createHash } from "node:crypto";
import {
  type BigIntStats,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  opendirSync,
  readSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { HASHED_ASSET } from "./security.js";
import { assertRetainedBrowserReleaseModes } from "./release-modes.js";

const ACTIVATION_FILENAME = "active-release.json";
const BUILD_INFO_FILENAME = "cx-build.json";
const BUILD_ID_META_NAME = "cx-build-id";
const RELEASE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BUILD_INFO_BYTES = 256 * 1024;
const MAX_RELEASE_DIRECTORIES = 16;
const MAX_RELEASE_METADATA_BYTES = 64 * 1024;
export const DEFAULT_BROWSER_ARTIFACT_MAX_BYTES = 512 * 1024 * 1024;
export const DEFAULT_BROWSER_ARTIFACT_MAX_ENTRIES = 100_000;
export const DEFAULT_BROWSER_ARTIFACT_MAX_DEPTH = 64;
export const DEFAULT_BROWSER_ARTIFACT_MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_BROWSER_SCAN_ENTRIES = DEFAULT_BROWSER_ARTIFACT_MAX_ENTRIES;
const MAX_BROWSER_SCAN_DEPTH = DEFAULT_BROWSER_ARTIFACT_MAX_DEPTH;
const BROWSER_ARTIFACT_HASH_CHUNK_BYTES = 64 * 1024;
const BUILD_ID_PLACEHOLDER = "__CX_BUILD_ID__";
const RELEASE_METADATA_KEYS = Object.freeze([
  "artifactDigest",
  "browserFiles",
  "buildId",
  "createdAt",
  "htmlFiles",
  "releaseId",
  "revision",
  "schemaVersion",
  "sourceDirty",
  "sourceFingerprint",
] as const);

interface CachedReleaseValidation {
  readonly identity: string;
  readonly release: BrowserRelease | null;
}

type ReleaseValidationCache = Map<string, CachedReleaseValidation>;

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

export type BrowserDirectoryMode =
  "active-release" | "default" | "missing" | "override";

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

interface ReleaseMetadata {
  readonly artifactDigest: string;
  readonly buildId: string;
  readonly browserFiles: number;
  readonly createdAt: string;
  readonly htmlFiles: number;
  readonly releaseId: string;
  readonly revision: string;
  readonly schemaVersion: 2;
  readonly sourceDirty: boolean;
  readonly sourceFingerprint: string;
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
export function validateBrowserArtifact(
  browserDir: string,
  {
    expectedBuildId,
    maxArtifactBytes = DEFAULT_BROWSER_ARTIFACT_MAX_BYTES,
    maxEntries = DEFAULT_BROWSER_ARTIFACT_MAX_ENTRIES,
    maxDepth = DEFAULT_BROWSER_ARTIFACT_MAX_DEPTH,
    maxFileBytes = DEFAULT_BROWSER_ARTIFACT_MAX_FILE_BYTES,
  }: ValidateBrowserArtifactOptions = {},
): BrowserArtifactValidation {
  assertBrowserArtifactLimits({
    maxArtifactBytes,
    maxDepth,
    maxEntries,
    maxFileBytes,
  });
  if (expectedBuildId !== undefined && !isReleaseId(expectedBuildId)) {
    throw new Error("Expected browser build id is invalid.");
  }
  const fileByteLimit = Math.min(maxFileBytes, maxArtifactBytes);
  const root = safeAbsolutePath(browserDir, "Browser artifact root");
  const rootSnapshot = requireArtifactDirectorySnapshot(
    root,
    "Browser artifact root",
  );
  const records: Array<{
    readonly absolutePath: string;
    readonly relativePath: string;
    readonly snapshot: BigIntStats;
    readonly type: "directory" | "file";
  }> = [];
  let totalBytes = 0;

  const walk = (
    directory: string,
    relativeDirectory: string,
    depth: number,
  ): void => {
    if (depth > maxDepth) {
      throw new Error(
        `Browser artifact exceeds the ${maxDepth}-level depth ceiling: ${directory}`,
      );
    }
    const directoryBefore = requireArtifactDirectorySnapshot(
      directory,
      "Browser artifact directory",
    );
    const handle = opendirSync(directory);
    try {
      for (let entry = handle.readSync(); entry; entry = handle.readSync()) {
        const relativePath = relativeDirectory
          ? `${relativeDirectory}/${entry.name}`
          : entry.name;
        const absolutePath = join(directory, entry.name);
        const snapshot = lstatSync(absolutePath, { bigint: true });
        if (snapshot.isSymbolicLink()) {
          throw new Error(
            `Browser artifact must not contain symbolic links: ${absolutePath}`,
          );
        }
        if (!snapshot.isFile() && !snapshot.isDirectory()) {
          throw new Error(
            `Browser artifact contains a special entry: ${absolutePath}`,
          );
        }
        if (snapshot.isFile() && snapshot.nlink !== 1n) {
          throw new Error(
            `Browser artifact files must not have hard-link aliases: ${absolutePath}`,
          );
        }
        const type = snapshot.isFile() ? "file" : "directory";
        records.push({ absolutePath, relativePath, snapshot, type });
        if (records.length > maxEntries) {
          throw new Error(
            `Browser artifact exceeds the ${maxEntries}-entry ceiling: ${root}`,
          );
        }
        if (type === "file") {
          const size = artifactSafeNumber(
            snapshot.size,
            `Browser artifact file size is unsafe: ${absolutePath}`,
          );
          if (size > fileByteLimit) {
            throw new Error(
              `Browser artifact file exceeds the ${fileByteLimit}-byte file ceiling: ${absolutePath}`,
            );
          }
          totalBytes += size;
          if (
            !Number.isSafeInteger(totalBytes) ||
            totalBytes > maxArtifactBytes
          ) {
            throw new Error(
              `Browser artifact exceeds the ${maxArtifactBytes}-byte total ceiling: ${root}`,
            );
          }
        } else {
          walk(absolutePath, relativePath, depth + 1);
        }
      }
    } finally {
      try {
        handle.closeSync();
      } catch (error) {
        if (!isNodeError(error) || error.code !== "ERR_DIR_CLOSED") throw error;
      }
    }
    assertArtifactSnapshotUnchanged(
      directory,
      directoryBefore,
      `Browser artifact directory changed during validation: ${directory}`,
    );
  };
  walk(root, "", 0);
  records.sort((left, right) =>
    Buffer.compare(
      Buffer.from(left.relativePath),
      Buffer.from(right.relativePath),
    ),
  );

  const buildInfo = records.find(
    (record) => record.relativePath === BUILD_INFO_FILENAME,
  );
  if (expectedBuildId === undefined && buildInfo !== undefined) {
    throw new Error(
      `Unsealed browser artifact already contains ${BUILD_INFO_FILENAME}: ${root}`,
    );
  }
  if (
    expectedBuildId !== undefined &&
    (buildInfo === undefined || buildInfo.type !== "file")
  ) {
    throw new Error(
      `Sealed browser artifact is missing ${BUILD_INFO_FILENAME}: ${root}`,
    );
  }

  const artifactRecords = records.filter(
    (record) => record.relativePath !== BUILD_INFO_FILENAME,
  );
  const index = artifactRecords.find(
    (record) => record.relativePath === "index.html",
  );
  if (index?.type !== "file") {
    throw new Error(
      `Browser artifact is missing its regular index.html entry: ${root}`,
    );
  }
  if (
    !artifactRecords.some(
      (record) =>
        record.type === "file" && /\.(?:js|mjs)$/i.test(record.relativePath),
    )
  ) {
    throw new Error(`Browser artifact contains no JavaScript bundle: ${root}`);
  }

  const manifest: BrowserArtifactManifestEntry[] = [];
  let artifactBytes = 0;
  let browserFiles = 0;
  let htmlFiles = 0;
  for (const record of artifactRecords) {
    if (record.type === "directory") {
      manifest.push(
        Object.freeze({
          mode: browserArtifactMode(record.snapshot.mode),
          path: record.relativePath,
          type: record.type,
        }),
      );
      continue;
    }

    browserFiles += 1;
    let canonicalBytes: Buffer | undefined;
    if (record.relativePath.toLowerCase().endsWith(".html")) {
      htmlFiles += 1;
      const sourceBytes = readStableArtifactFile(
        record.absolutePath,
        record.snapshot,
        fileByteLimit,
        "Browser HTML entry",
      );
      let source: string;
      try {
        source = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
      } catch (error) {
        throw new Error(
          `Browser HTML entry is not valid UTF-8: ${record.absolutePath}`,
          { cause: error },
        );
      }
      canonicalBytes = Buffer.from(
        canonicalizeBrowserHtmlBuildIdentity(
          source,
          expectedBuildId ?? BUILD_ID_PLACEHOLDER,
          record.absolutePath,
        ),
      );
    }
    const digest = canonicalBytes
      ? createHash("sha256").update(canonicalBytes).digest("hex")
      : hashStableArtifactFile(
          record.absolutePath,
          record.snapshot,
          fileByteLimit,
        );
    const canonicalSize = canonicalBytes
      ? canonicalBytes.length
      : artifactSafeNumber(
          record.snapshot.size,
          `Browser artifact file size is unsafe: ${record.absolutePath}`,
        );
    artifactBytes += canonicalSize;
    if (
      !Number.isSafeInteger(artifactBytes) ||
      artifactBytes > maxArtifactBytes
    ) {
      throw new Error(
        `Canonical browser artifact exceeds the ${maxArtifactBytes}-byte total ceiling: ${root}`,
      );
    }
    manifest.push(
      Object.freeze({
        bytes: canonicalSize,
        digest,
        mode: browserArtifactMode(record.snapshot.mode),
        path: record.relativePath,
        type: record.type,
      }),
    );
  }
  if (htmlFiles < 1) {
    throw new Error(`Browser artifact contains no HTML entry files: ${root}`);
  }

  const hash = createHash("sha256");
  hash.update("cx-browser-artifact-v2\0");
  for (const entry of manifest) {
    hashBrowserArtifactValue(hash, entry.path);
    hash.update(`\0${entry.type}\0${entry.mode}\0`);
    if (entry.type === "file") {
      hash.update(`${String(entry.bytes)}:`);
      hash.update(entry.digest ?? "");
    }
    hash.update("\0");
  }
  for (const record of records) {
    assertArtifactSnapshotUnchanged(
      record.absolutePath,
      record.snapshot,
      `Browser artifact entry changed during validation: ${record.absolutePath}`,
    );
  }
  assertArtifactSnapshotUnchanged(
    root,
    rootSnapshot,
    `Browser artifact root changed during validation: ${root}`,
  );
  return Object.freeze({
    artifactBytes,
    artifactDigest: hash.digest("hex"),
    artifactEntries: artifactRecords.length,
    browserFiles,
    htmlFiles,
    manifest: Object.freeze(manifest),
    totalBytes,
  });
}

export function browserReleasePaths(repoRoot: string): BrowserReleasePaths {
  const resolvedRepo = safeAbsolutePath(repoRoot, "Repository root");
  const root = join(resolvedRepo, ".run", "site-releases");
  return Object.freeze({
    activation: join(root, ACTIVATION_FILENAME),
    currentBrowser: join(root, "current-browser"),
    releases: join(root, "releases"),
    repoRoot: resolvedRepo,
    root,
  });
}

export function resolveBrowserDirectory({
  repoRoot,
  defaultBrowserDir,
  browserDirOverride,
}: {
  repoRoot: string;
  defaultBrowserDir: string;
  browserDirOverride?: string;
}): BrowserDirectorySelection {
  const paths = browserReleasePaths(repoRoot);
  const defaultDirectory = safeAbsolutePath(
    defaultBrowserDir,
    "Default browser directory",
  );

  if (browserDirOverride !== undefined) {
    const override = configuredBrowserOverride(
      paths.repoRoot,
      browserDirOverride,
    );
    return Object.freeze({
      browserDir: validateBrowserDirectory(override),
      mode: "override",
      repoRoot: paths.repoRoot,
      useReleaseHistory: false,
    });
  }

  const currentEntry = lstatIfPresent(paths.currentBrowser);
  if (currentEntry) {
    readActiveBrowserRelease(paths.repoRoot);
    return Object.freeze({
      browserDir: paths.currentBrowser,
      mode: "active-release",
      repoRoot: paths.repoRoot,
      useReleaseHistory: true,
    });
  }

  if (lstatIfPresent(paths.activation)) {
    throw new Error(
      `This site selected versioned releases, but its active browser link is missing: ${paths.currentBrowser}`,
    );
  }

  try {
    return Object.freeze({
      browserDir: validateBrowserDirectory(defaultDirectory),
      mode: "default",
      repoRoot: paths.repoRoot,
      useReleaseHistory: false,
    });
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
  }

  return Object.freeze({
    browserDir: defaultDirectory,
    mode: "missing",
    repoRoot: paths.repoRoot,
    useReleaseHistory: false,
  });
}

export function browserDirectoryForSnapshot(
  selection: BrowserDirectorySelection,
): string {
  if (selection.mode === "active-release") {
    if (!selection.repoRoot) {
      throw new Error(
        "An active browser release requires its repository root.",
      );
    }
    return readActiveBrowserRelease(selection.repoRoot).canonicalBrowserDir;
  }
  return validateBrowserDirectory(selection.browserDir);
}

export function readActiveBrowserRelease(repoRoot: string): BrowserRelease {
  const paths = browserReleasePaths(repoRoot);
  validateReleaseLayout(paths);
  const current = lstatIfPresent(paths.currentBrowser);
  if (!current) {
    throw new Error(`Active browser link is missing: ${paths.currentBrowser}`);
  }
  if (!current.isSymbolicLink()) {
    throw new Error(
      `Active browser path must be a symbolic link: ${paths.currentBrowser}`,
    );
  }

  let canonicalTarget: string;
  try {
    canonicalTarget = realpathSync(paths.currentBrowser);
  } catch (error) {
    throw new Error(
      `Active browser link is dangling: ${paths.currentBrowser}`,
      {
        cause: error,
      },
    );
  }
  return readBrowserReleaseSnapshot(paths.repoRoot, canonicalTarget);
}

/** Validate one already-resolved immutable release browser without rereading the active pointer. */
export function readBrowserReleaseSnapshot(
  repoRoot: string,
  browserDir: string,
): BrowserRelease {
  const paths = browserReleasePaths(repoRoot);
  validateReleaseLayout(paths);
  const resolvedBrowserDir = safeAbsolutePath(
    browserDir,
    "Release browser snapshot",
  );
  const browserEntry = lstatIfPresent(resolvedBrowserDir);
  if (!browserEntry?.isDirectory() || browserEntry.isSymbolicLink()) {
    throw new Error(
      `Release browser snapshot is missing or unsafe: ${resolvedBrowserDir}`,
    );
  }
  const canonicalTarget = realpathSync(resolvedBrowserDir);
  const canonicalReleases = realpathSync(paths.releases);
  const targetRelative = relative(canonicalReleases, canonicalTarget);
  const segments = targetRelative.split(sep);
  if (
    segments.length !== 2 ||
    segments[1] !== "browser" ||
    !isReleaseId(segments[0]) ||
    isAbsolute(targetRelative) ||
    targetRelative.startsWith("..")
  ) {
    throw new Error(
      `Release browser snapshot is outside the versioned release contract: ${canonicalTarget}`,
    );
  }

  const release = readBrowserRelease(paths.repoRoot, segments[0]);
  if (release.canonicalBrowserDir !== canonicalTarget) {
    throw new Error(
      `Release browser snapshot does not resolve to its validated browser: ${canonicalTarget}`,
    );
  }
  return release;
}

export function listBrowserReleases(repoRoot: string): BrowserRelease[] {
  return listBrowserReleasesWithCache(repoRoot);
}

function listBrowserReleasesWithCache(
  repoRoot: string,
  validationCache?: ReleaseValidationCache,
): BrowserRelease[] {
  const paths = browserReleasePaths(repoRoot);
  try {
    validateReleaseLayout(paths);
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
  const releaseIds: string[] = [];
  const directory = opendirSync(paths.releases);
  try {
    let inspected = 0;
    for (
      let entry = directory.readSync();
      entry;
      entry = directory.readSync()
    ) {
      inspected += 1;
      if (inspected > MAX_RELEASE_DIRECTORIES) {
        throw new Error(
          `Release history exceeds the ${MAX_RELEASE_DIRECTORIES}-entry runtime limit: ${paths.releases}`,
        );
      }
      if (
        entry.isDirectory() &&
        !entry.isSymbolicLink() &&
        isReleaseId(entry.name)
      ) {
        releaseIds.push(entry.name);
      }
    }
  } finally {
    directory.closeSync();
  }
  const nextCache: ReleaseValidationCache = new Map();
  const releases = releaseIds
    .map((releaseId) => {
      const releaseDirectory = join(paths.releases, releaseId);
      const identity = releaseDirectoryIdentity(releaseDirectory);
      if (!identity) return undefined;
      const cached = validationCache?.get(releaseId);
      if (cached?.identity === identity) {
        nextCache.set(releaseId, cached);
        return cached.release ?? undefined;
      }
      let release: BrowserRelease | null = null;
      try {
        release = readBrowserRelease(paths.repoRoot, releaseId);
      } catch {
        // Invalid immutable releases remain unavailable until their directory identity changes.
      }
      nextCache.set(releaseId, Object.freeze({ identity, release }));
      return release ?? undefined;
    })
    .filter((entry): entry is BrowserRelease => entry !== undefined)
    .sort((left, right) => right.createdAtMs - left.createdAtMs);
  if (validationCache) {
    validationCache.clear();
    for (const [releaseId, cached] of nextCache) {
      validationCache.set(releaseId, cached);
    }
  }
  return releases;
}

export type RetainedBrowserAssetResolver = (
  requestPath: string,
) => RetainedBrowserAsset | undefined;

/** Create one bounded resolver for a server middleware instance. */
export function createRetainedBrowserAssetResolver(
  repoRoot: string,
): RetainedBrowserAssetResolver {
  const resolvedRepoRoot = browserReleasePaths(repoRoot).repoRoot;
  const validationCache: ReleaseValidationCache = new Map();
  listBrowserReleasesWithCache(resolvedRepoRoot, validationCache);
  return (requestPath) =>
    findRetainedBrowserAssetInReleases(
      listBrowserReleasesWithCache(resolvedRepoRoot, validationCache),
      requestPath,
    );
}

export function findRetainedBrowserAsset(
  repoRoot: string,
  requestPath: string,
): RetainedBrowserAsset | undefined {
  return findRetainedBrowserAssetInReleases(
    listBrowserReleases(repoRoot),
    requestPath,
  );
}

function findRetainedBrowserAssetInReleases(
  releases: readonly BrowserRelease[],
  requestPath: string,
): RetainedBrowserAsset | undefined {
  const relativePath = safeHashedAssetPath(requestPath);
  if (!relativePath) return undefined;

  for (const release of releases) {
    const candidate = resolve(release.canonicalBrowserDir, relativePath);
    if (!isContainedPath(release.canonicalBrowserDir, candidate)) continue;
    const entry = lstatIfPresent(candidate);
    if (!entry?.isFile() || entry.isSymbolicLink()) continue;
    const canonicalCandidate = realpathSync(candidate);
    if (!isContainedPath(release.canonicalBrowserDir, canonicalCandidate)) {
      continue;
    }
    return Object.freeze({
      canonicalBrowserDir: release.canonicalBrowserDir,
      filePath: canonicalCandidate,
      relativePath: relative(release.canonicalBrowserDir, canonicalCandidate),
      releaseId: release.releaseId,
    });
  }
  return undefined;
}

function releaseDirectoryIdentity(
  releaseDirectory: string,
): string | undefined {
  try {
    const entry = lstatSync(releaseDirectory, { bigint: true });
    if (!entry.isDirectory() || entry.isSymbolicLink()) return undefined;
    return `${entry.dev}:${entry.ino}:${entry.ctimeNs}`;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function validateBrowserDirectory(browserDir: string): string {
  const resolved = safeAbsolutePath(browserDir, "Browser directory");
  const directory = lstatIfPresent(resolved);
  if (!directory) {
    throw missingPathError(`Browser directory is missing: ${resolved}`);
  }
  if (!directory.isDirectory() || directory.isSymbolicLink()) {
    throw new Error(`Browser directory is unsafe: ${resolved}`);
  }
  const canonical = realpathSync(resolved);
  const indexPath = join(resolved, "index.html");
  const index = lstatIfPresent(indexPath);
  if (!index) {
    throw missingPathError(
      `Browser output is missing ${join(resolved, "index.html")}.`,
    );
  }
  if (!index.isFile() || index.isSymbolicLink()) {
    throw new Error(`Browser entry is unsafe: ${indexPath}`);
  }
  if (!isContainedPath(canonical, realpathSync(indexPath))) {
    throw new Error(`Browser entry resolves outside its output: ${indexPath}`);
  }
  const hasJavaScript = hasBoundedJavaScriptBundle(canonical);
  if (!hasJavaScript) {
    throw new Error(
      `Browser output at ${resolved} contains no JavaScript bundle.`,
    );
  }
  return canonical;
}

function readBrowserRelease(
  repoRoot: string,
  releaseId: string,
): BrowserRelease {
  if (!isReleaseId(releaseId)) {
    throw new Error(`Invalid release id: ${releaseId}`);
  }
  const paths = browserReleasePaths(repoRoot);
  validateReleaseLayout(paths);
  const releaseDirectory = join(paths.releases, releaseId);
  const releaseEntry = lstatIfPresent(releaseDirectory);
  if (!releaseEntry?.isDirectory() || releaseEntry.isSymbolicLink()) {
    throw new Error(
      `Release directory is missing or unsafe: ${releaseDirectory}`,
    );
  }
  const canonicalRelease = realpathSync(releaseDirectory);
  if (canonicalRelease !== join(realpathSync(paths.releases), releaseId)) {
    throw new Error(
      `Release directory resolves outside its canonical path: ${releaseDirectory}`,
    );
  }
  assertExactReleaseEntries(releaseDirectory);
  assertRetainedBrowserReleaseModes(releaseDirectory, {
    maxDepth: MAX_BROWSER_SCAN_DEPTH + 1,
    maxEntries: MAX_BROWSER_SCAN_ENTRIES + 3,
  });

  const browserDir = join(releaseDirectory, "browser");
  const browserEntry = lstatIfPresent(browserDir);
  if (!browserEntry?.isDirectory() || browserEntry.isSymbolicLink()) {
    throw new Error(
      `Release browser directory is missing or unsafe: ${browserDir}`,
    );
  }
  const canonicalBrowserDir = validateBrowserDirectory(browserDir);
  if (canonicalBrowserDir !== join(canonicalRelease, "browser")) {
    throw new Error(
      `Release browser directory resolves outside its canonical path: ${browserDir}`,
    );
  }

  const metadataPath = join(releaseDirectory, "release.json");
  const metadata = readReleaseMetadata(metadataPath, releaseId);
  const artifact = validateBrowserArtifact(browserDir, {
    expectedBuildId: metadata.buildId,
  });
  if (
    artifact.artifactDigest !== metadata.artifactDigest ||
    artifact.browserFiles !== metadata.browserFiles ||
    artifact.htmlFiles !== metadata.htmlFiles
  ) {
    throw new Error(
      `Browser release artifact no longer matches its sealed identity: ${browserDir}`,
    );
  }
  const buildInfoPath = join(browserDir, BUILD_INFO_FILENAME);
  const buildInfo = validateReleaseMetadataObject(
    readJsonObject(
      buildInfoPath,
      "Release build identity",
      MAX_BUILD_INFO_BYTES,
    ),
    buildInfoPath,
    releaseId,
  );
  for (const field of RELEASE_METADATA_KEYS) {
    if (buildInfo[field] !== metadata[field]) {
      throw new Error(
        `Release build identity does not match metadata field ${field}: ${buildInfoPath}`,
      );
    }
  }

  return Object.freeze({
    browserDir,
    canonicalBrowserDir,
    createdAtMs: Date.parse(metadata.createdAt),
    releaseId,
  });
}

function assertExactReleaseEntries(releaseDirectory: string): void {
  const names: string[] = [];
  const directory = opendirSync(releaseDirectory);
  try {
    for (
      let entry = directory.readSync();
      entry;
      entry = directory.readSync()
    ) {
      names.push(entry.name);
      if (names.length > 2) {
        throw new Error(
          `Browser release contains entries outside its exact contract: ${releaseDirectory}`,
        );
      }
    }
  } finally {
    directory.closeSync();
  }
  names.sort();
  if (
    names.length !== 2 ||
    names[0] !== "browser" ||
    names[1] !== "release.json"
  ) {
    throw new Error(
      `Browser release contains entries outside its exact contract: ${releaseDirectory}`,
    );
  }
}

function assertBrowserArtifactLimits({
  maxArtifactBytes,
  maxDepth,
  maxEntries,
  maxFileBytes,
}: Required<Omit<ValidateBrowserArtifactOptions, "expectedBuildId">>): void {
  for (const [label, value, maximum] of [
    ["maxArtifactBytes", maxArtifactBytes, DEFAULT_BROWSER_ARTIFACT_MAX_BYTES],
    ["maxEntries", maxEntries, DEFAULT_BROWSER_ARTIFACT_MAX_ENTRIES],
    ["maxDepth", maxDepth, DEFAULT_BROWSER_ARTIFACT_MAX_DEPTH],
    ["maxFileBytes", maxFileBytes, DEFAULT_BROWSER_ARTIFACT_MAX_FILE_BYTES],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
      throw new Error(
        `${label} must be a positive safe integer no larger than ${maximum}.`,
      );
    }
  }
}

function requireArtifactDirectorySnapshot(
  directory: string,
  label: string,
): BigIntStats {
  const snapshot = lstatSync(directory, { bigint: true });
  if (!snapshot.isDirectory() || snapshot.isSymbolicLink()) {
    throw new Error(`${label} is missing, linked, or unsafe: ${directory}`);
  }
  return snapshot;
}

function readStableArtifactFile(
  filePath: string,
  expectedSnapshot: BigIntStats,
  maximumBytes: number,
  label: string,
): Buffer {
  const flags =
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(filePath, flags);
    const before = fstatSync(descriptor, { bigint: true });
    if (
      !before.isFile() ||
      before.nlink !== 1n ||
      !sameArtifactSnapshot(before, expectedSnapshot)
    ) {
      throw new Error(`${label} changed before it was read: ${filePath}`);
    }
    const size = artifactSafeNumber(
      before.size,
      `${label} size is unsafe: ${filePath}`,
    );
    if (size > maximumBytes) {
      throw new Error(`${label} exceeds ${maximumBytes} bytes: ${filePath}`);
    }
    const bytes = Buffer.allocUnsafe(size);
    let offset = 0;
    while (offset < size) {
      const bytesRead = readSync(
        descriptor,
        bytes,
        offset,
        size - offset,
        offset,
      );
      if (bytesRead < 1) {
        throw new Error(`${label} ended while it was read: ${filePath}`);
      }
      offset += bytesRead;
    }
    const after = fstatSync(descriptor, { bigint: true });
    const atPath = lstatArtifactIfPresent(filePath);
    if (
      !sameArtifactSnapshot(before, after) ||
      !atPath ||
      !sameArtifactSnapshot(after, atPath)
    ) {
      throw new Error(`${label} changed while it was read: ${filePath}`);
    }
    return bytes;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

function hashStableArtifactFile(
  filePath: string,
  expectedSnapshot: BigIntStats,
  maximumBytes: number,
): string {
  const flags =
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(filePath, flags);
    const before = fstatSync(descriptor, { bigint: true });
    if (
      !before.isFile() ||
      before.nlink !== 1n ||
      !sameArtifactSnapshot(before, expectedSnapshot)
    ) {
      throw new Error(
        `Browser artifact file changed before hashing: ${filePath}`,
      );
    }
    const size = artifactSafeNumber(
      before.size,
      `Browser artifact file size is unsafe: ${filePath}`,
    );
    if (size > maximumBytes) {
      throw new Error(
        `Browser artifact file exceeds ${maximumBytes} bytes: ${filePath}`,
      );
    }
    const hash = createHash("sha256");
    const buffer = Buffer.allocUnsafe(BROWSER_ARTIFACT_HASH_CHUNK_BYTES);
    let position = 0;
    while (position < size) {
      const length = Math.min(buffer.length, size - position);
      const bytesRead = readSync(descriptor, buffer, 0, length, position);
      if (bytesRead < 1) {
        throw new Error(
          `Browser artifact file ended while hashing: ${filePath}`,
        );
      }
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
    const after = fstatSync(descriptor, { bigint: true });
    const atPath = lstatArtifactIfPresent(filePath);
    if (
      !sameArtifactSnapshot(before, after) ||
      !atPath ||
      !sameArtifactSnapshot(after, atPath)
    ) {
      throw new Error(
        `Browser artifact file changed while hashing: ${filePath}`,
      );
    }
    return hash.digest("hex");
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

export function canonicalizeBrowserHtmlBuildIdentity(
  source: string,
  expectedBuildId: string,
  file: string,
): string {
  return replaceBrowserHtmlBuildIdentity(
    source,
    expectedBuildId,
    BUILD_ID_PLACEHOLDER,
    file,
  );
}

/** Stamp one real, direct-child-of-head build marker from the source placeholder. */
export function stampBrowserHtmlBuildIdentity(
  source: string,
  buildId: string,
  file: string,
): string {
  return replaceBrowserHtmlBuildIdentity(
    source,
    BUILD_ID_PLACEHOLDER,
    buildId,
    file,
  );
}

/** Prove one real, direct-child-of-head build marker without changing the HTML. */
export function assertBrowserHtmlBuildIdentity(
  source: string,
  expectedBuildId: string,
  file: string,
): void {
  replaceBrowserHtmlBuildIdentity(
    source,
    expectedBuildId,
    expectedBuildId,
    file,
  );
}

interface BrowserHtmlBuildMarker {
  readonly contentEnd: number;
  readonly contentStart: number;
  readonly contentValue: string;
}

interface BrowserHtmlTag {
  readonly attributes: ReadonlyMap<
    string,
    { readonly end: number; readonly start: number; readonly value: string }
  >;
  readonly closing: boolean;
  readonly end: number;
  readonly name: string;
  readonly selfClosing: boolean;
}

const VOID_HTML_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const RAW_TEXT_HTML_ELEMENTS = new Set(["script", "style"]);

function replaceBrowserHtmlBuildIdentity(
  source: string,
  expectedBuildId: string,
  replacementBuildId: string,
  file: string,
): string {
  if (
    typeof source !== "string" ||
    typeof expectedBuildId !== "string" ||
    typeof replacementBuildId !== "string" ||
    expectedBuildId.length === 0 ||
    replacementBuildId.length === 0
  ) {
    throw new TypeError("Browser HTML build identity input is invalid.");
  }
  const markers = browserHtmlBuildMarkers(source, file);
  if (markers.length !== 1) {
    throw new Error(
      `HTML entry must contain exactly one real ${BUILD_ID_META_NAME} marker directly in head: ${file}`,
    );
  }
  const marker = markers[0];
  if (!marker || marker.contentValue !== expectedBuildId) {
    throw new Error(`HTML entry has the wrong build identity: ${file}`);
  }
  return (
    source.slice(0, marker.contentStart) +
    replacementBuildId +
    source.slice(marker.contentEnd)
  );
}

function browserHtmlBuildMarkers(
  source: string,
  file: string,
): BrowserHtmlBuildMarker[] {
  const markers: BrowserHtmlBuildMarker[] = [];
  const stack: string[] = [];
  const lowerSource = source.toLowerCase();
  let bodyStarted = false;
  let headOpen = false;
  let htmlSeen = false;
  let headSeen = false;
  let cursor = 0;
  while (cursor < source.length) {
    const tagStart = source.indexOf("<", cursor);
    if (tagStart < 0) break;
    if (source.startsWith("<!--", tagStart)) {
      const commentEnd = source.indexOf("-->", tagStart + 4);
      if (commentEnd < 0) {
        throw new Error(`HTML entry contains an unterminated comment: ${file}`);
      }
      cursor = commentEnd + 3;
      continue;
    }
    if (
      source.startsWith("<!", tagStart) ||
      source.startsWith("<?", tagStart)
    ) {
      cursor = htmlDeclarationEnd(source, tagStart, file);
      continue;
    }
    const tag = parseBrowserHtmlTag(source, tagStart, file);
    if (!tag) {
      cursor = tagStart + 1;
      continue;
    }
    cursor = tag.end;
    if (tag.closing) {
      if (tag.name === "head") {
        if (!headOpen || stack.at(-1) !== "head") {
          throw new Error(
            `HTML entry has a noncanonical head element: ${file}`,
          );
        }
        headOpen = false;
      }
      const openIndex = stack.lastIndexOf(tag.name);
      if (openIndex >= 0) stack.length = openIndex;
      continue;
    }

    if (tag.name === "html") {
      if (htmlSeen || stack.length !== 0 || headSeen || bodyStarted) {
        throw new Error(`HTML entry has a noncanonical html element: ${file}`);
      }
      htmlSeen = true;
    } else if (tag.name === "head") {
      if (
        !htmlSeen ||
        headSeen ||
        bodyStarted ||
        headOpen ||
        stack.length !== 1 ||
        stack[0] !== "html"
      ) {
        throw new Error(`HTML entry has a noncanonical head element: ${file}`);
      }
      headSeen = true;
      headOpen = true;
    } else if (tag.name === "body") {
      if (
        !htmlSeen ||
        !headSeen ||
        headOpen ||
        bodyStarted ||
        stack.length !== 1 ||
        stack[0] !== "html"
      ) {
        throw new Error(`HTML entry has a noncanonical body element: ${file}`);
      }
      bodyStarted = true;
    }

    if (
      tag.name === "meta" &&
      headOpen &&
      !bodyStarted &&
      stack.at(-1) === "head"
    ) {
      const names = [...tag.attributes.keys()].sort();
      const name = tag.attributes.get("name");
      if (name?.value === BUILD_ID_META_NAME) {
        if (
          names.length !== 2 ||
          names[0] !== "content" ||
          names[1] !== "name"
        ) {
          throw new Error(
            `HTML build marker must contain exactly name and content attributes: ${file}`,
          );
        }
        const content = tag.attributes.get("content");
        if (!content) {
          throw new Error(`HTML build marker is missing content: ${file}`);
        }
        markers.push({
          contentEnd: content.end,
          contentStart: content.start,
          contentValue: content.value,
        });
      }
    }

    if (RAW_TEXT_HTML_ELEMENTS.has(tag.name) && !tag.selfClosing) {
      cursor = rawTextElementEnd(source, lowerSource, cursor, tag.name, file);
      continue;
    }
    if (!VOID_HTML_ELEMENTS.has(tag.name) && !tag.selfClosing) {
      stack.push(tag.name);
    }
  }
  return markers;
}

function htmlDeclarationEnd(
  source: string,
  start: number,
  file: string,
): number {
  const end = source.indexOf(">", start + 2);
  if (end < 0) {
    throw new Error(`HTML entry contains an unterminated declaration: ${file}`);
  }
  return end + 1;
}

function rawTextElementEnd(
  source: string,
  lowerSource: string,
  start: number,
  name: string,
  file: string,
): number {
  let candidate = lowerSource.indexOf(`</${name}`, start);
  while (candidate >= 0) {
    const tag = parseBrowserHtmlTag(source, candidate, file);
    if (tag?.closing && tag.name === name) return tag.end;
    candidate = lowerSource.indexOf(`</${name}`, candidate + 2);
  }
  throw new Error(
    `HTML entry contains an unterminated ${name} element: ${file}`,
  );
}

function parseBrowserHtmlTag(
  source: string,
  start: number,
  file: string,
): BrowserHtmlTag | undefined {
  let cursor = start + 1;
  let closing = false;
  if (source[cursor] === "/") {
    closing = true;
    cursor += 1;
  }
  const nameStart = cursor;
  while (cursor < source.length && /[A-Za-z0-9:-]/.test(source[cursor] ?? "")) {
    cursor += 1;
  }
  if (cursor === nameStart) return undefined;
  const name = source.slice(nameStart, cursor).toLowerCase();
  const attributes = new Map<
    string,
    { readonly end: number; readonly start: number; readonly value: string }
  >();
  let selfClosing = false;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    if (source[cursor] === ">") {
      cursor += 1;
      return { attributes, closing, end: cursor, name, selfClosing };
    }
    if (source[cursor] === "/" && source[cursor + 1] === ">") {
      cursor += 2;
      selfClosing = true;
      return { attributes, closing, end: cursor, name, selfClosing };
    }
    if (closing) {
      throw new Error(`HTML closing tag contains unexpected data: ${file}`);
    }
    const attributeStart = cursor;
    while (cursor < source.length && !/[\s"'<>/=]/.test(source[cursor] ?? "")) {
      cursor += 1;
    }
    if (cursor === attributeStart) {
      throw new Error(`HTML entry contains a malformed tag: ${file}`);
    }
    const attributeName = source.slice(attributeStart, cursor).toLowerCase();
    if (attributes.has(attributeName)) {
      throw new Error(
        `HTML entry contains duplicate ${attributeName} attributes: ${file}`,
      );
    }
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
    let value = "";
    let valueStart = cursor;
    let valueEnd = cursor;
    if (source[cursor] === "=") {
      cursor += 1;
      while (/\s/.test(source[cursor] ?? "")) cursor += 1;
      const quote = source[cursor];
      if (quote === '"' || quote === "'") {
        cursor += 1;
        valueStart = cursor;
        const end = source.indexOf(quote, cursor);
        if (end < 0) {
          throw new Error(
            `HTML entry contains an unterminated attribute: ${file}`,
          );
        }
        valueEnd = end;
        value = source.slice(valueStart, valueEnd);
        cursor = end + 1;
      } else {
        valueStart = cursor;
        while (cursor < source.length && !/[\s<>]/.test(source[cursor] ?? "")) {
          cursor += 1;
        }
        valueEnd = cursor;
        value = source.slice(valueStart, valueEnd);
      }
    }
    attributes.set(attributeName, {
      end: valueEnd,
      start: valueStart,
      value,
    });
  }
  throw new Error(`HTML entry contains an unterminated tag: ${file}`);
}

function browserArtifactMode(mode: bigint): string {
  return Number(mode & 0o7777n)
    .toString(8)
    .padStart(4, "0");
}

function hashBrowserArtifactValue(
  hash: ReturnType<typeof createHash>,
  value: string,
): void {
  hash.update(`${Buffer.byteLength(value)}:`);
  hash.update(value);
}

function artifactSafeNumber(value: bigint, message: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(message);
  }
  return Number(value);
}

function sameArtifactSnapshot(left: BigIntStats, right: BigIntStats): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.uid === right.uid &&
    left.gid === right.gid &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function assertArtifactSnapshotUnchanged(
  candidate: string,
  expected: BigIntStats,
  message: string,
): void {
  const current = lstatArtifactIfPresent(candidate);
  if (!current || !sameArtifactSnapshot(current, expected)) {
    throw new Error(message);
  }
}

function lstatArtifactIfPresent(candidate: string): BigIntStats | undefined {
  try {
    return lstatSync(candidate, { bigint: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

function readReleaseMetadata(
  metadataPath: string,
  releaseId: string,
): ReleaseMetadata {
  const metadata = readJsonObject(
    metadataPath,
    "Release metadata",
    MAX_RELEASE_METADATA_BYTES,
  );
  return validateReleaseMetadataObject(metadata, metadataPath, releaseId);
}

function validateReleaseMetadataObject(
  metadata: Readonly<Record<string, unknown>>,
  metadataPath: string,
  releaseId: string,
): ReleaseMetadata {
  const keys = Object.keys(metadata).sort();
  if (
    keys.length !== RELEASE_METADATA_KEYS.length ||
    keys.some((key, index) => key !== RELEASE_METADATA_KEYS[index]) ||
    metadata["schemaVersion"] !== 2 ||
    metadata["releaseId"] !== releaseId ||
    !isReleaseId(metadata["buildId"]) ||
    typeof metadata["artifactDigest"] !== "string" ||
    !SHA256_PATTERN.test(metadata["artifactDigest"]) ||
    metadata["buildId"] !== `build-${metadata["artifactDigest"]}` ||
    typeof metadata["sourceFingerprint"] !== "string" ||
    !SHA256_PATTERN.test(metadata["sourceFingerprint"]) ||
    typeof metadata["sourceDirty"] !== "boolean" ||
    typeof metadata["revision"] !== "string" ||
    !metadata["revision"].trim() ||
    typeof metadata["createdAt"] !== "string" ||
    !Number.isFinite(Date.parse(metadata["createdAt"])) ||
    !Number.isSafeInteger(metadata["browserFiles"]) ||
    Number(metadata["browserFiles"]) < 1 ||
    !Number.isSafeInteger(metadata["htmlFiles"]) ||
    Number(metadata["htmlFiles"]) < 1
  ) {
    throw new Error(
      `Release metadata does not match the versioned release contract: ${metadataPath}`,
    );
  }
  return metadata as unknown as ReleaseMetadata;
}

function readJsonObject(
  filePath: string,
  label: string,
  maximumBytes: number,
): Readonly<Record<string, unknown>> {
  const entry = lstatIfPresent(filePath);
  if (!entry?.isFile() || entry.isSymbolicLink()) {
    throw new Error(`${label} is missing or unsafe: ${filePath}`);
  }
  if (entry.size > maximumBytes) {
    throw new Error(
      `${label} exceeds the ${maximumBytes}-byte validation limit: ${filePath}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readBoundedUtf8File(filePath, label, maximumBytes));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${filePath}`, { cause: error });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object: ${filePath}`);
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function validateReleaseLayout(paths: BrowserReleasePaths): void {
  const directories = [
    paths.repoRoot,
    join(paths.repoRoot, ".run"),
    paths.root,
    paths.releases,
  ];
  const canonicalRepo = realpathSync(paths.repoRoot);
  for (const directory of directories) {
    const entry = lstatIfPresent(directory);
    if (!entry?.isDirectory() || entry.isSymbolicLink()) {
      throw missingPathError(
        `Versioned release directory is missing or unsafe: ${directory}`,
      );
    }
    const canonical = realpathSync(directory);
    if (
      canonical !== canonicalRepo &&
      !isContainedPath(canonicalRepo, canonical)
    ) {
      throw new Error(
        `Versioned release directory escapes its repository: ${directory}`,
      );
    }
  }
}

function safeHashedAssetPath(requestPath: string): string | undefined {
  if (typeof requestPath !== "string") return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath.split(/[?#]/, 1)[0] ?? "");
  } catch {
    return undefined;
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    /[\u0000-\u001f\u007f\\]/.test(decoded)
  ) {
    return undefined;
  }
  const segments = decoded.slice(1).split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return undefined;
  }
  const relativePath = segments.join("/");
  return HASHED_ASSET.test(relativePath) ? relativePath : undefined;
}

function hasBoundedJavaScriptBundle(root: string): boolean {
  const pending = [{ depth: 0, path: root }];
  let inspected = 0;
  let foundJavaScript = false;
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;
    const directory = opendirSync(current.path);
    try {
      for (
        let entry = directory.readSync();
        entry;
        entry = directory.readSync()
      ) {
        inspected += 1;
        if (inspected > MAX_BROWSER_SCAN_ENTRIES) {
          throw new Error(
            `Browser output exceeds the ${MAX_BROWSER_SCAN_ENTRIES}-entry validation limit: ${root}`,
          );
        }
        const candidate = join(current.path, entry.name);
        if (entry.isSymbolicLink()) {
          throw new Error(
            `Browser output must not contain symbolic links: ${candidate}`,
          );
        }
        if (!entry.isFile() && !entry.isDirectory()) {
          throw new Error(
            `Browser output contains an unsupported filesystem entry: ${candidate}`,
          );
        }
        if (entry.isFile() && /\.(?:js|mjs)$/i.test(entry.name)) {
          foundJavaScript = true;
        }
        if (entry.isDirectory()) {
          if (current.depth >= MAX_BROWSER_SCAN_DEPTH) {
            throw new Error(
              `Browser output exceeds the ${MAX_BROWSER_SCAN_DEPTH}-level validation limit: ${root}`,
            );
          }
          pending.push({ depth: current.depth + 1, path: candidate });
        }
      }
    } finally {
      directory.closeSync();
    }
  }
  return foundJavaScript;
}

function readBoundedUtf8File(
  filePath: string,
  label: string,
  maximumBytes: number,
): string {
  let descriptor: number;
  try {
    descriptor = openSync(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    throw new Error(`${label} is missing or unsafe: ${filePath}`, {
      cause: error,
    });
  }
  try {
    const opened = fstatSync(descriptor);
    if (!opened.isFile()) {
      throw new Error(`${label} is not a regular file: ${filePath}`);
    }
    if (opened.size > maximumBytes) {
      throw new Error(
        `${label} exceeds the ${maximumBytes}-byte validation limit: ${filePath}`,
      );
    }
    const content = Buffer.allocUnsafe(maximumBytes + 1);
    let offset = 0;
    while (offset <= maximumBytes) {
      const bytesRead = readSync(
        descriptor,
        content,
        offset,
        maximumBytes + 1 - offset,
        null,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > maximumBytes) {
      throw new Error(
        `${label} exceeds the ${maximumBytes}-byte validation limit: ${filePath}`,
      );
    }
    return content.toString("utf8", 0, offset);
  } finally {
    closeSync(descriptor);
  }
}

function configuredBrowserOverride(repoRoot: string, value: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(
      "Browser directory override must be a safe non-empty path.",
    );
  }
  return isAbsolute(value) ? resolve(value) : resolve(repoRoot, value);
}

function safeAbsolutePath(value: string, label: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} must be a safe non-empty path.`);
  }
  return resolve(value);
}

function isContainedPath(parent: string, candidate: string): boolean {
  const contained = relative(resolve(parent), resolve(candidate));
  return (
    contained !== "" &&
    contained !== ".." &&
    !contained.startsWith(`..${sep}`) &&
    !isAbsolute(contained)
  );
}

function lstatIfPresent(
  candidate: string,
): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(candidate);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return undefined;
    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function missingPathError(message: string): Error & { code: "ENOENT" } {
  return Object.assign(new Error(message), { code: "ENOENT" as const });
}

function isMissingPathError(error: unknown): boolean {
  return isNodeError(error) && error.code === "ENOENT";
}

function isReleaseId(value: unknown): value is string {
  return typeof value === "string" && RELEASE_ID_PATTERN.test(value);
}

function htmlAttributeValue(tag: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, "i");
  return tag.match(pattern)?.[2];
}
