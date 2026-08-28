import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  type BigIntStats,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { TextDecoder } from "node:util";

import { optionalEnvironmentValue, type Environment } from "./configuration.js";
import type { Middleware } from "./http.js";

export const SERVER_IDENTITY_PATH = "/cx-server.json";
export const SERVER_IDENTITY_ENVIRONMENT_KEY =
  "CX_SERVER_RELEASE_IDENTITY_FILE";
export const MAX_SERVER_IDENTITY_BYTES = 64 * 1024;
export const MAX_SERVER_RELEASE_ARTIFACT_BYTES = 512 * 1024 * 1024;
export const MAX_SERVER_RELEASE_ARTIFACT_ENTRIES = 100_000;
export const MAX_SERVER_RELEASE_WORKERS = 64;

const RELEASE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const REVISION_PATTERN = /^[a-f0-9]{40,64}$/;
const ENTRYPOINT_PART_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

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

interface ServerReleaseIdentitySourcePin {
  readonly canonicalFile: string;
  readonly configuredFile: string;
  readonly snapshot: ServerReleaseIdentityFileSnapshot;
  readonly source: string;
}

interface ServerReleaseIdentityFileSnapshot {
  readonly ctimeNs: bigint;
  readonly dev: bigint;
  readonly ino: bigint;
  readonly mode: bigint;
  readonly mtimeNs: bigint;
  readonly nlink: bigint;
  readonly size: bigint;
}

interface OpenServerReleaseIdentityFile {
  readonly canonicalFile: string;
  readonly configuredFile: string;
  readonly descriptor: number;
  readonly snapshot: ServerReleaseIdentityFileSnapshot;
  readonly source: string;
}

const sourcePins = new WeakMap<
  ServerReleaseIdentity,
  ServerReleaseIdentitySourcePin
>();

export function parseServerReleaseArtifactDeclaration(
  value: unknown,
): ServerReleaseArtifactDeclaration {
  const declaration = plainObject(value, "Server release artifact declaration");
  assertExactKeys(declaration, ["entrypoint", "workers"]);
  const entrypoint = safeEntrypoint(declaration["entrypoint"], "entrypoint");
  const workers = workerIdentities(declaration["workers"], entrypoint, false);
  return Object.freeze({ entrypoint, workers });
}

export function parseServerReleaseIdentity(
  value: unknown,
): ServerReleaseIdentity {
  const identity = plainObject(value, "Server release identity");
  assertExactKeys(identity, [
    "artifactBytes",
    "artifactDigest",
    "artifactFiles",
    "createdAt",
    "entrypoint",
    "nodeMajor",
    "releaseId",
    "revision",
    "schemaVersion",
    "serverBuildId",
    "sourceDirty",
    "sourceFingerprint",
    "workers",
  ]);

  if (identity["schemaVersion"] !== 1) {
    throw new Error("Server release identity schemaVersion must be 1.");
  }
  const releaseId = releaseIdentifier(identity["releaseId"], "releaseId");
  const artifactDigest = sha256(identity["artifactDigest"], "artifactDigest");
  if (identity["serverBuildId"] !== `server-${artifactDigest}`) {
    throw new Error(
      "Server release identity serverBuildId must match artifactDigest.",
    );
  }
  const revision = stringMatching(
    identity["revision"],
    REVISION_PATTERN,
    "revision",
  );
  const sourceFingerprint = sha256(
    identity["sourceFingerprint"],
    "sourceFingerprint",
  );
  if (typeof identity["sourceDirty"] !== "boolean") {
    throw new Error("Server release identity sourceDirty must be a boolean.");
  }
  const createdAt = isoTimestamp(identity["createdAt"], "createdAt");
  const entrypoint = safeEntrypoint(identity["entrypoint"], "entrypoint");
  const workers = workerIdentities(identity["workers"], entrypoint);
  if (identity["nodeMajor"] !== 26) {
    throw new Error("Server release identity nodeMajor must be 26.");
  }
  const artifactFiles = boundedInteger(
    identity["artifactFiles"],
    "artifactFiles",
    MAX_SERVER_RELEASE_ARTIFACT_ENTRIES,
  );
  const artifactBytes = boundedInteger(
    identity["artifactBytes"],
    "artifactBytes",
    MAX_SERVER_RELEASE_ARTIFACT_BYTES,
  );

  return Object.freeze({
    schemaVersion: 1,
    releaseId,
    serverBuildId: `server-${artifactDigest}`,
    revision,
    sourceFingerprint,
    sourceDirty: identity["sourceDirty"],
    artifactDigest,
    createdAt,
    entrypoint,
    workers,
    nodeMajor: 26,
    artifactFiles,
    artifactBytes,
  });
}

export function loadServerReleaseIdentity({
  environment = process.env,
  identityFile,
  required = false,
}: LoadServerReleaseIdentityOptions = {}): ServerReleaseIdentity | undefined {
  const selectedFile = selectServerReleaseIdentityFile({
    environment,
    ...(identityFile === undefined ? {} : { identityFile }),
  });
  if (selectedFile === undefined) {
    if (required) {
      throw new Error(
        `Server release identity requires ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`,
      );
    }
    return undefined;
  }
  const opened = openServerReleaseIdentityFile(selectedFile);
  try {
    const identity = parseServerReleaseIdentityJson(opened.source);
    sourcePins.set(identity, sourcePin(opened));
    return identity;
  } finally {
    closeSync(opened.descriptor);
  }
}

/**
 * Reopen and retain the exact identity file that produced an already-pinned release identity.
 * Parsed lookalikes are rejected: the expected object must originate from
 * loadServerReleaseIdentity(), and its path, inode snapshot, bytes, and exact parsed identity must
 * all still match when the lease is acquired.
 */
export function acquireServerReleaseIdentityFileLease({
  environment = process.env,
  identity,
  identityFile,
}: AcquireServerReleaseIdentityFileLeaseOptions): ServerReleaseIdentityFileLease {
  const expectedIdentity = parseServerReleaseIdentity(identity);
  const expectedSource = sourcePins.get(identity);
  if (!expectedSource) {
    throw new Error(
      "Server release identity lease requires the exact identity loaded from its configured file.",
    );
  }
  const selectedFile = selectServerReleaseIdentityFile({
    environment,
    ...(identityFile === undefined ? {} : { identityFile }),
  });
  if (selectedFile === undefined) {
    throw new Error(
      `Server release identity lease requires ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`,
    );
  }

  const opened = openServerReleaseIdentityFile(selectedFile);
  try {
    const currentIdentity = parseServerReleaseIdentityJson(opened.source);
    if (
      opened.configuredFile !== expectedSource.configuredFile ||
      opened.canonicalFile !== expectedSource.canonicalFile ||
      !sameServerReleaseIdentityFileSnapshot(
        opened.snapshot,
        expectedSource.snapshot,
      ) ||
      opened.source !== expectedSource.source ||
      !sameServerReleaseIdentity(currentIdentity, expectedIdentity)
    ) {
      throw new Error(
        "Server release identity changed between startup and worker lease acquisition.",
      );
    }

    let descriptor: number | undefined = opened.descriptor;
    return Object.freeze({
      get closed(): boolean {
        return descriptor === undefined;
      },
      close(): void {
        if (descriptor === undefined) return;
        const ownedDescriptor = descriptor;
        descriptor = undefined;
        closeSync(ownedDescriptor);
      },
      identityFile: opened.canonicalFile,
    });
  } catch (error) {
    try {
      closeSync(opened.descriptor);
    } catch (closeError) {
      throw new AggregateError(
        [error, closeError],
        "Server release identity lease failed and its descriptor could not be closed.",
      );
    }
    throw error;
  }
}

export function serverReleaseIdentityMiddleware(
  identity: ServerReleaseIdentity,
): Middleware {
  const pinned = parseServerReleaseIdentity(identity);
  return (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.status(200).type("application/json").json(pinned);
  };
}

function openServerReleaseIdentityFile(
  file: string,
): OpenServerReleaseIdentityFile {
  if (!isAbsolute(file)) {
    throw new Error("Server release identity file must be an absolute path.");
  }
  const configuredFile = resolve(file);
  let configuredEntry: BigIntStats;
  let canonicalFile: string;
  try {
    configuredEntry = lstatSync(configuredFile, { bigint: true });
    if (configuredEntry.isSymbolicLink() || !configuredEntry.isFile()) {
      throw new Error(
        `Server release identity must be a regular non-symlink file: ${configuredFile}`,
      );
    }
    canonicalFile = realpathSync(configuredFile);
    const canonicalEntry = lstatSync(canonicalFile, { bigint: true });
    if (
      canonicalEntry.isSymbolicLink() ||
      !canonicalEntry.isFile() ||
      !sameServerReleaseIdentityFileIdentity(configuredEntry, canonicalEntry)
    ) {
      throw new Error(
        "Server release identity changed while its canonical path was resolved.",
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Server release identity must be") ||
        error.message.startsWith("Server release identity changed"))
    ) {
      throw error;
    }
    throw new Error(
      `Server release identity file is missing or unsafe: ${configuredFile}`,
      { cause: error },
    );
  }

  let descriptor: number;
  try {
    descriptor = openSync(
      canonicalFile,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch (error) {
    throw new Error(
      `Server release identity file is missing or unsafe: ${configuredFile}`,
      { cause: error },
    );
  }
  try {
    const before = fstatSync(descriptor, { bigint: true });
    if (
      !before.isFile() ||
      !sameServerReleaseIdentityFileIdentity(configuredEntry, before)
    ) {
      throw new Error("Server release identity changed while it was opened.");
    }
    if (before.size < 2n) {
      throw new Error("Server release identity file must contain JSON.");
    }
    if (before.size > BigInt(MAX_SERVER_IDENTITY_BYTES)) {
      throw new Error(
        `Server release identity exceeds ${MAX_SERVER_IDENTITY_BYTES} bytes.`,
      );
    }
    const content = Buffer.allocUnsafe(MAX_SERVER_IDENTITY_BYTES + 1);
    let offset = 0;
    while (offset <= MAX_SERVER_IDENTITY_BYTES) {
      const count = readSync(
        descriptor,
        content,
        offset,
        content.length - offset,
        null,
      );
      if (count === 0) break;
      offset += count;
    }
    if (offset > MAX_SERVER_IDENTITY_BYTES) {
      throw new Error(
        `Server release identity exceeds ${MAX_SERVER_IDENTITY_BYTES} bytes.`,
      );
    }
    const after = fstatSync(descriptor, { bigint: true });
    const currentConfigured = lstatSync(configuredFile, { bigint: true });
    const currentCanonical = lstatSync(canonicalFile, { bigint: true });
    if (
      BigInt(offset) !== before.size ||
      !sameServerReleaseIdentityFileSnapshot(before, after) ||
      !sameServerReleaseIdentityFileSnapshot(before, currentConfigured) ||
      !sameServerReleaseIdentityFileSnapshot(before, currentCanonical) ||
      realpathSync(configuredFile) !== canonicalFile
    ) {
      throw new Error("Server release identity changed while it was read.");
    }
    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(
        content.subarray(0, offset),
      );
    } catch (error) {
      throw new Error("Server release identity file must be valid UTF-8.", {
        cause: error,
      });
    }
    return Object.freeze({
      canonicalFile,
      configuredFile,
      descriptor,
      snapshot: serverReleaseIdentityFileSnapshot(before),
      source,
    });
  } catch (error) {
    try {
      closeSync(descriptor);
    } catch (closeError) {
      throw new AggregateError(
        [error, closeError],
        "Server release identity loading failed and its descriptor could not be closed.",
      );
    }
    throw error;
  }
}

function parseServerReleaseIdentityJson(source: string): ServerReleaseIdentity {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error("Server release identity file must contain valid JSON.", {
      cause: error,
    });
  }
  return parseServerReleaseIdentity(parsed);
}

function selectServerReleaseIdentityFile({
  environment,
  identityFile,
}: {
  readonly environment: Environment;
  readonly identityFile?: string;
}): string | undefined {
  const environmentFile = optionalEnvironmentValue(
    environment,
    SERVER_IDENTITY_ENVIRONMENT_KEY,
  );
  if (identityFile !== undefined && environmentFile !== undefined) {
    throw new Error(
      `Configure the server identity once, not in both options and ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`,
    );
  }
  return identityFile ?? environmentFile;
}

function sourcePin(
  opened: OpenServerReleaseIdentityFile,
): ServerReleaseIdentitySourcePin {
  return Object.freeze({
    canonicalFile: opened.canonicalFile,
    configuredFile: opened.configuredFile,
    snapshot: opened.snapshot,
    source: opened.source,
  });
}

function serverReleaseIdentityFileSnapshot(
  value: BigIntStats,
): ServerReleaseIdentityFileSnapshot {
  return Object.freeze({
    ctimeNs: value.ctimeNs,
    dev: value.dev,
    ino: value.ino,
    mode: value.mode,
    mtimeNs: value.mtimeNs,
    nlink: value.nlink,
    size: value.size,
  });
}

function sameServerReleaseIdentityFileIdentity(
  left: BigIntStats | ServerReleaseIdentityFileSnapshot,
  right: BigIntStats | ServerReleaseIdentityFileSnapshot,
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameServerReleaseIdentityFileSnapshot(
  left: BigIntStats | ServerReleaseIdentityFileSnapshot,
  right: BigIntStats | ServerReleaseIdentityFileSnapshot,
): boolean {
  return (
    sameServerReleaseIdentityFileIdentity(left, right) &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function sameServerReleaseIdentity(
  left: ServerReleaseIdentity,
  right: ServerReleaseIdentity,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function workerIdentities(
  value: unknown,
  webEntrypoint: string,
  requireSorted = true,
): readonly ServerReleaseWorkerIdentity[] {
  if (!Array.isArray(value) || value.length > MAX_SERVER_RELEASE_WORKERS) {
    throw new Error(
      `Server release identity workers must contain at most ${MAX_SERVER_RELEASE_WORKERS} entries.`,
    );
  }
  const keys = new Set<string>();
  const entrypoints = new Set<string>([webEntrypoint]);
  const workers = value.map((candidate, index) => {
    const worker = plainObject(candidate, `workers[${index}]`);
    assertExactKeys(worker, ["entrypoint", "key"]);
    const key = releaseIdentifier(worker["key"], `workers[${index}].key`);
    const entrypoint = safeEntrypoint(
      worker["entrypoint"],
      `workers[${index}].entrypoint`,
    );
    if (keys.has(key) || entrypoints.has(entrypoint)) {
      throw new Error("Server release worker identities must be unique.");
    }
    keys.add(key);
    entrypoints.add(entrypoint);
    return Object.freeze({ key, entrypoint });
  });
  const sorted = [...workers].sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  if (
    requireSorted &&
    workers.some((worker, index) => worker !== sorted[index])
  ) {
    throw new Error("Server release workers must be sorted by key.");
  }
  return Object.freeze(requireSorted ? workers : sorted);
}

function safeEntrypoint(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`Server release identity ${label} is invalid.`);
  }
  const parts = value.split("/");
  if (
    parts.length === 0 ||
    parts.some(
      (part) =>
        part === "." || part === ".." || !ENTRYPOINT_PART_PATTERN.test(part),
    ) ||
    !/\.(?:js|mjs)$/.test(parts.at(-1) ?? "")
  ) {
    throw new Error(
      `Server release identity ${label} must stay inside the artifact.`,
    );
  }
  return value;
}

function releaseIdentifier(value: unknown, label: string): string {
  return stringMatching(value, RELEASE_ID_PATTERN, label);
}

function sha256(value: unknown, label: string): string {
  return stringMatching(value, SHA256_PATTERN, label);
}

function stringMatching(
  value: unknown,
  pattern: RegExp,
  label: string,
): string {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error(`Server release identity ${label} is invalid.`);
  }
  return value;
}

function isoTimestamp(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`Server release identity ${label} is invalid.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`Server release identity ${label} is invalid.`);
  }
  return value;
}

function boundedInteger(
  value: unknown,
  label: string,
  maximum: number,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 1 ||
    (value as number) > maximum
  ) {
    throw new Error(
      `Server release identity ${label} must be an integer from 1 to ${maximum}.`,
    );
  }
  return value as number;
}

function plainObject(value: unknown, label: string): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right),
  );
  const sortedExpected = [...expected].sort((left, right) =>
    left.localeCompare(right),
  );
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error("Server release identity fields are invalid.");
  }
}
