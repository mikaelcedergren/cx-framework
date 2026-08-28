import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  opendirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  browserReleasePaths,
  listBrowserReleases,
  readActiveBrowserRelease,
  validateBrowserArtifact,
} from "./browser-releases.js";
import {
  RETAINED_RELEASE_DIRECTORY_MODE,
  RETAINED_RELEASE_FILE_MODE,
} from "./release-modes.js";

const SYNTHETIC_RELEASE_ID = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i;
const SYNTHETIC_FILE_SEGMENT = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const SYNTHETIC_BUNDLE_FILENAME = "main-SYNTHETIC.js";
const SYNTHETIC_BUILD_ID_PLACEHOLDER = "__CX_BUILD_ID__";
const SYNTHETIC_BROWSER_FILES = new Set([
  "cx-build.json",
  "index.html",
  SYNTHETIC_BUNDLE_FILENAME.toLowerCase(),
]);
const MAX_SYNTHETIC_FILES = 128;
const MAX_SYNTHETIC_FILE_BYTES = 4 * 1024 * 1024;
const MAX_SYNTHETIC_TOTAL_BYTES = 8 * 1024 * 1024;

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
export function activateSyntheticBrowserReleaseFixture({
  createdAt = new Date().toISOString(),
  files = {},
  releaseId,
  repoRoot,
}: SyntheticBrowserReleaseFixtureOptions): SyntheticBrowserReleaseFixture {
  assertSyntheticReleaseId(releaseId);
  const normalizedCreatedAt = normalizeSyntheticCreatedAt(createdAt);
  const fixtureFiles = normalizeSyntheticFiles(files);
  const paths = browserReleasePaths(repoRoot);
  const canonicalRepoRoot = requireSyntheticRepository(paths.repoRoot);
  ensureSyntheticDirectory(join(paths.repoRoot, ".run"), canonicalRepoRoot);
  ensureSyntheticDirectory(paths.root, canonicalRepoRoot);
  ensureSyntheticDirectory(paths.releases, canonicalRepoRoot);

  const currentEntry = lstatIfPresent(paths.currentBrowser);
  const activationEntry = lstatIfPresent(paths.activation);
  if (Boolean(currentEntry) !== Boolean(activationEntry)) {
    throw new Error(
      "Synthetic browser release fixtures refuse to repair an incomplete active-release layout.",
    );
  }
  if (currentEntry && !currentEntry.isSymbolicLink()) {
    throw new Error(
      `Synthetic active browser path must be a symbolic link: ${paths.currentBrowser}`,
    );
  }
  if (
    activationEntry &&
    (!activationEntry.isFile() || activationEntry.isSymbolicLink())
  ) {
    throw new Error(
      `Synthetic activation metadata must be a regular non-symlink file: ${paths.activation}`,
    );
  }
  const previousReleaseId = currentEntry
    ? readActiveBrowserRelease(paths.repoRoot).releaseId
    : null;

  const releaseDir = join(paths.releases, releaseId);
  try {
    mkdirSync(releaseDir);
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") {
      throw new Error(
        `Synthetic browser release already exists and is immutable: ${releaseId}`,
        { cause: error },
      );
    }
    throw error;
  }

  let pointerActivated = false;
  const browserDir = join(releaseDir, "browser");
  try {
    mkdirSync(browserDir);
    const indexSource =
      "<!doctype html><html><head>" +
      `<meta name="cx-build-id" content="${SYNTHETIC_BUILD_ID_PLACEHOLDER}">` +
      "</head><body>synthetic browser release</body></html>\n";
    writeSyntheticFile(join(browserDir, "index.html"), indexSource);
    writeSyntheticFile(
      join(browserDir, SYNTHETIC_BUNDLE_FILENAME),
      "export {};\n",
    );
    for (const fixtureFile of fixtureFiles) {
      const filePath = syntheticBrowserFilePath(
        browserDir,
        fixtureFile.relativePath,
      );
      ensureSyntheticFileParent(browserDir, filePath);
      writeSyntheticFile(filePath, fixtureFile.content);
    }

    sealSyntheticBrowserRelease(browserDir);
    const unsealed = validateBrowserArtifact(browserDir, {
      maxArtifactBytes: MAX_SYNTHETIC_TOTAL_BYTES,
      maxEntries: MAX_SYNTHETIC_FILES + 2,
      maxFileBytes: MAX_SYNTHETIC_FILE_BYTES,
    });
    const digest = unsealed.artifactDigest;
    const buildId = `build-${digest}`;
    const revision = digest.slice(0, 40);
    const sourceFingerprint = createHash("sha256")
      .update(`cx-synthetic-source\0${digest}`)
      .digest("hex");
    makeSyntheticReleaseWritable(browserDir);
    for (const relativePath of [
      "index.html",
      ...fixtureFiles
        .map((entry) => entry.relativePath)
        .filter((entry) => entry.toLowerCase().endsWith(".html")),
    ]) {
      stampSyntheticHtmlBuildId(
        syntheticBrowserFilePath(browserDir, relativePath),
        buildId,
      );
    }

    const metadata = Object.freeze({
      schemaVersion: 2 as const,
      releaseId,
      buildId,
      revision,
      sourceFingerprint,
      sourceDirty: true,
      artifactDigest: digest,
      createdAt: normalizedCreatedAt,
      browserFiles: unsealed.browserFiles,
      htmlFiles: unsealed.htmlFiles,
    });
    writeSyntheticJson(join(releaseDir, "release.json"), metadata);
    writeSyntheticJson(join(browserDir, "cx-build.json"), {
      schemaVersion: metadata.schemaVersion,
      buildId: metadata.buildId,
      releaseId: metadata.releaseId,
      revision: metadata.revision,
      sourceFingerprint: metadata.sourceFingerprint,
      sourceDirty: metadata.sourceDirty,
      artifactDigest: metadata.artifactDigest,
      createdAt: metadata.createdAt,
      browserFiles: metadata.browserFiles,
      htmlFiles: metadata.htmlFiles,
    });
    sealSyntheticBrowserRelease(releaseDir);
    const sealed = validateBrowserArtifact(browserDir, {
      expectedBuildId: buildId,
      maxArtifactBytes: MAX_SYNTHETIC_TOTAL_BYTES,
      maxEntries: MAX_SYNTHETIC_FILES + 3,
      maxFileBytes: MAX_SYNTHETIC_FILE_BYTES,
    });
    if (
      sealed.artifactDigest !== unsealed.artifactDigest ||
      sealed.browserFiles !== unsealed.browserFiles ||
      sealed.htmlFiles !== unsealed.htmlFiles
    ) {
      throw new Error(
        `Synthetic browser release changed while its build identity was stamped: ${releaseId}`,
      );
    }

    // Validate through the reader's own complete history contract before changing either active
    // pointer. This shares its exact tree depth, entry count, release count, metadata, and browser
    // validation limits instead of copying private constants into the fixture writer.
    const stagedRelease = listBrowserReleases(paths.repoRoot).find(
      (release) => release.releaseId === releaseId,
    );
    if (!stagedRelease) {
      throw new Error(
        `Synthetic browser release was rejected by the shared reader contract: ${releaseId}`,
      );
    }

    const nonce = `${process.pid}-${randomUUID()}`;
    const temporaryPointer = join(paths.root, `.synthetic-current-${nonce}`);
    const temporaryActivation = join(
      paths.root,
      `.synthetic-activation-${nonce}.json`,
    );
    try {
      symlinkSync(
        join("releases", releaseId, "browser"),
        temporaryPointer,
        "dir",
      );
      writeSyntheticJson(temporaryActivation, {
        schemaVersion: 1,
        activeReleaseId: releaseId,
        previousReleaseId,
        activatedAt: normalizedCreatedAt,
      });
      renameSync(temporaryPointer, paths.currentBrowser);
      pointerActivated = true;
      renameSync(temporaryActivation, paths.activation);
    } finally {
      rmSync(temporaryPointer, { force: true });
      rmSync(temporaryActivation, { force: true });
    }

    const active = readActiveBrowserRelease(paths.repoRoot);
    if (active.releaseId !== releaseId) {
      throw new Error(
        `Synthetic browser release activation resolved an unexpected release: ${active.releaseId}`,
      );
    }
    return Object.freeze({ ...active, buildId });
  } catch (error) {
    if (!pointerActivated) {
      makeSyntheticReleaseRemovable(releaseDir);
      rmSync(releaseDir, { force: true, recursive: true });
    }
    throw error;
  }
}

function sealSyntheticBrowserRelease(root: string): void {
  const directories: string[] = [];
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) break;
    directories.push(directory);
    const handle = opendirSync(directory);
    try {
      for (let entry = handle.readSync(); entry; entry = handle.readSync()) {
        const candidate = join(directory, entry.name);
        const snapshot = lstatSync(candidate);
        if (snapshot.isDirectory() && !snapshot.isSymbolicLink()) {
          pending.push(candidate);
        } else if (snapshot.isFile() && !snapshot.isSymbolicLink()) {
          chmodSync(candidate, RETAINED_RELEASE_FILE_MODE);
        } else {
          throw new Error(
            `Synthetic browser release contains an unsupported entry: ${candidate}`,
          );
        }
      }
    } finally {
      handle.closeSync();
    }
  }
  for (const directory of directories.reverse()) {
    chmodSync(directory, RETAINED_RELEASE_DIRECTORY_MODE);
  }
}

function makeSyntheticReleaseWritable(root: string): void {
  const entry = lstatIfPresent(root);
  if (!entry?.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(
      `Synthetic browser release is not writable safely: ${root}`,
    );
  }
  chmodSync(root, Number(entry.mode) | 0o700);
  const handle = opendirSync(root);
  try {
    for (let child = handle.readSync(); child; child = handle.readSync()) {
      const candidate = join(root, child.name);
      const snapshot = lstatSync(candidate);
      if (snapshot.isDirectory() && !snapshot.isSymbolicLink()) {
        makeSyntheticReleaseWritable(candidate);
      } else if (snapshot.isFile() && !snapshot.isSymbolicLink()) {
        chmodSync(candidate, Number(snapshot.mode) | 0o600);
      } else {
        throw new Error(
          `Synthetic browser release contains an unsupported entry: ${candidate}`,
        );
      }
    }
  } finally {
    handle.closeSync();
  }
}

function stampSyntheticHtmlBuildId(file: string, buildId: string): void {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(
      readFileSync(file),
    );
  } catch (error) {
    throw new Error(`Synthetic browser HTML is not valid UTF-8: ${file}`, {
      cause: error,
    });
  }
  const occurrences = source.split(SYNTHETIC_BUILD_ID_PLACEHOLDER).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Synthetic browser HTML must contain exactly one build-id placeholder: ${file}`,
    );
  }
  writeFileSync(file, source.replace(SYNTHETIC_BUILD_ID_PLACEHOLDER, buildId));
}

function makeSyntheticReleaseRemovable(root: string): void {
  const entry = lstatIfPresent(root);
  if (!entry?.isDirectory() || entry.isSymbolicLink()) return;
  const handle = opendirSync(root);
  try {
    for (let child = handle.readSync(); child; child = handle.readSync()) {
      const candidate = join(root, child.name);
      const snapshot = lstatSync(candidate);
      if (snapshot.isDirectory() && !snapshot.isSymbolicLink()) {
        makeSyntheticReleaseRemovable(candidate);
      }
    }
  } finally {
    handle.closeSync();
  }
  chmodSync(root, Number(entry.mode) | 0o700);
}

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

export async function probeServer(
  origin: string,
  probes: readonly ServerProbe[],
  fetchImplementation: typeof fetch = globalThis.fetch,
): Promise<ServerProbeResult[]> {
  const base = new URL(origin);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.pathname !== "/" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new Error(
      "Server probe origin must be an HTTP(S) origin without a path.",
    );
  }
  const results: ServerProbeResult[] = [];
  for (const probe of probes) {
    if (!probe.path.startsWith("/") || probe.path.startsWith("//")) {
      throw new Error(
        `Probe path must be a same-origin absolute path: ${probe.path}`,
      );
    }
    const probeUrl = new URL(probe.path, base);
    if (probeUrl.origin !== base.origin) {
      throw new Error(
        `Probe path must resolve inside ${base.origin}: ${probe.path}`,
      );
    }
    const headers = probeHeaders(probe);
    const response = await fetchImplementation(probeUrl, {
      method: probe.method ?? (probe.body === undefined ? "GET" : "POST"),
      ...(headers ? { headers } : {}),
      ...(probe.body === undefined ? {} : { body: JSON.stringify(probe.body) }),
      cache: "no-store",
      redirect: "manual",
    });
    if (response.status !== probe.status) {
      throw new Error(
        `Expected ${probe.path} to return ${probe.status}; received ${response.status}.`,
      );
    }
    results.push({ path: probe.path, status: response.status });
  }
  return results;
}

function probeHeaders(
  probe: ServerProbe,
): Readonly<Record<string, string>> | undefined {
  if (probe.body === undefined) return probe.headers;
  const headers = { ...probe.headers };
  if (
    !Object.keys(headers).some((name) => name.toLowerCase() === "content-type")
  ) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

interface NormalizedSyntheticFile {
  readonly content: Uint8Array;
  readonly relativePath: string;
}

function assertSyntheticReleaseId(releaseId: string): void {
  if (typeof releaseId !== "string" || !SYNTHETIC_RELEASE_ID.test(releaseId)) {
    throw new Error(
      `Invalid synthetic browser release id: ${String(releaseId)}`,
    );
  }
}

function normalizeSyntheticCreatedAt(createdAt: string): string {
  if (
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    throw new Error(
      "Synthetic browser release createdAt must be an ISO timestamp.",
    );
  }
  return new Date(createdAt).toISOString();
}

function normalizeSyntheticFiles(
  files: Readonly<Record<string, SyntheticBrowserReleaseFile>>,
): NormalizedSyntheticFile[] {
  if (!files || typeof files !== "object" || Array.isArray(files)) {
    throw new Error("Synthetic browser release files must be an object.");
  }
  const entries = Object.entries(files);
  if (entries.length > MAX_SYNTHETIC_FILES) {
    throw new Error(
      `Synthetic browser release exceeds the ${MAX_SYNTHETIC_FILES}-file limit.`,
    );
  }
  const normalized: NormalizedSyntheticFile[] = [];
  const portablePaths = new Set<string>();
  let totalBytes = 0;
  for (const [relativePath, content] of entries) {
    assertSyntheticRelativePath(relativePath);
    const portablePath = relativePath.toLowerCase();
    if (SYNTHETIC_BROWSER_FILES.has(portablePath)) {
      throw new Error(
        `Synthetic browser release file is owned by the fixture: ${relativePath}`,
      );
    }
    if (portablePaths.has(portablePath)) {
      throw new Error(
        `Synthetic browser release file collides on portable filesystems: ${relativePath}`,
      );
    }
    portablePaths.add(portablePath);
    const bytes =
      typeof content === "string"
        ? Buffer.from(content, "utf8")
        : content instanceof Uint8Array
          ? Buffer.from(content)
          : undefined;
    if (!bytes) {
      throw new Error(
        `Synthetic browser release file must be text or bytes: ${relativePath}`,
      );
    }
    if (bytes.byteLength > MAX_SYNTHETIC_FILE_BYTES) {
      throw new Error(
        `Synthetic browser release file exceeds the ${MAX_SYNTHETIC_FILE_BYTES}-byte limit: ${relativePath}`,
      );
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_SYNTHETIC_TOTAL_BYTES) {
      throw new Error(
        `Synthetic browser release exceeds the ${MAX_SYNTHETIC_TOTAL_BYTES}-byte total limit.`,
      );
    }
    normalized.push(Object.freeze({ content: bytes, relativePath }));
  }
  return normalized.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

function assertSyntheticRelativePath(relativePath: string): void {
  if (
    typeof relativePath !== "string" ||
    !relativePath ||
    relativePath.length > 1_024 ||
    isAbsolute(relativePath) ||
    relativePath.startsWith("/") ||
    /[\u0000-\u001f\u007f\\]/.test(relativePath)
  ) {
    throw new Error(
      `Synthetic browser release file must use a safe relative path: ${String(relativePath)}`,
    );
  }
  const segments = relativePath.split("/");
  if (
    segments.some(
      (segment) =>
        !SYNTHETIC_FILE_SEGMENT.test(segment) ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new Error(
      `Synthetic browser release file must use a safe relative path: ${relativePath}`,
    );
  }
}

function requireSyntheticRepository(repoRoot: string): string {
  const entry = lstatIfPresent(repoRoot);
  if (!entry?.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(
      `Synthetic browser release repository must be an existing real directory: ${repoRoot}`,
    );
  }
  return realpathSync(repoRoot);
}

function ensureSyntheticDirectory(
  directory: string,
  canonicalRepoRoot: string,
): void {
  let entry = lstatIfPresent(directory);
  if (!entry) {
    mkdirSync(directory);
    entry = lstatSync(directory);
  }
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(
      `Synthetic browser release path must be a real directory: ${directory}`,
    );
  }
  const canonical = realpathSync(directory);
  if (!isContainedPath(canonicalRepoRoot, canonical)) {
    throw new Error(
      `Synthetic browser release path escapes its repository: ${directory}`,
    );
  }
}

function syntheticBrowserFilePath(
  browserDir: string,
  relativePath: string,
): string {
  const candidate = resolve(browserDir, ...relativePath.split("/"));
  if (!isContainedPath(browserDir, candidate)) {
    throw new Error(
      `Synthetic browser release file escapes its browser root: ${relativePath}`,
    );
  }
  return candidate;
}

function ensureSyntheticFileParent(browserDir: string, filePath: string): void {
  const relativeParent = relative(browserDir, resolve(filePath, ".."));
  if (!relativeParent) return;
  let current = browserDir;
  for (const segment of relativeParent.split(sep)) {
    current = join(current, segment);
    const entry = lstatIfPresent(current);
    if (!entry) {
      mkdirSync(current);
      continue;
    }
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(
        `Synthetic browser release file parent must be a real directory: ${current}`,
      );
    }
  }
}

function writeSyntheticFile(
  filePath: string,
  content: string | Uint8Array,
): void {
  writeFileSync(filePath, content, { flag: "wx", mode: 0o600 });
}

function writeSyntheticJson(
  filePath: string,
  value: Readonly<Record<string, unknown>>,
): void {
  writeSyntheticFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
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
