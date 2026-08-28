import fs from "node:fs";
import path from "node:path";
import { parseEnv, TextDecoder } from "node:util";

import {
  ConfigurationError,
  type Environment,
  nodeEnvironmentValue,
} from "./configuration.js";

const PRIVATE_FILE_MODE = 0o600;
export const MAX_PRIVATE_ENVIRONMENT_FILE_BYTES = 64 * 1_024;

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export interface LoadPrivateEnvironmentFileOptions {
  readonly allowedKeys: ReadonlySet<string>;
  readonly environment: NodeJS.ProcessEnv;
  readonly file: string;
  readonly mode: PrivateEnvironmentFileLoadMode;
}

export type PrivateEnvironmentFileLoadMode =
  "optional-ambient" | "required-authoritative";

export type PrivateEnvironmentFileStartupMode =
  "skip" | PrivateEnvironmentFileLoadMode;

/**
 * Select one exact startup policy for a role-owned private environment file.
 *
 * Test processes never inspect a private file. Development may explicitly opt out and otherwise
 * keeps ambient-value precedence for local ergonomics. Production cannot opt out: its private
 * values come only from the required role file.
 */
export function privateEnvironmentFileStartupMode({
  bypassKey,
  environment,
}: {
  readonly bypassKey: string;
  readonly environment: Environment;
}): PrivateEnvironmentFileStartupMode {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(bypassKey)) {
    throw new TypeError(
      "Private environment bypassKey must be a canonical environment variable name.",
    );
  }
  const nodeEnvironment = nodeEnvironmentValue(environment);
  const bypass = environment[bypassKey];
  if (bypass !== undefined && bypass !== "false") {
    throw new ConfigurationError(
      `${bypassKey} must be exactly false when it is set.`,
    );
  }
  if (nodeEnvironment === "production") {
    if (bypass !== undefined) {
      throw new ConfigurationError(
        `${bypassKey}=false cannot disable the required production private environment file.`,
      );
    }
    return "required-authoritative";
  }
  if (nodeEnvironment === "test" || bypass === "false") return "skip";
  return "optional-ambient";
}

/** The parsed file named a key outside the consumer-owned allowlist. */
export class UnsupportedPrivateEnvironmentKeyError extends Error {
  readonly key: string;

  constructor(file: string, key: string) {
    super(
      `Private environment file ${path.basename(file)} contains unsupported key ${key}.`,
    );
    this.name = "UnsupportedPrivateEnvironmentKeyError";
    this.key = key;
  }
}

/**
 * Load one owner-private environment file without following its final path entry.
 *
 * In `optional-ambient` mode, only an ENOENT from the initial atomic open means that the file is
 * absent and an already-present ambient value retains precedence. In `required-authoritative`
 * mode, absence fails closed and the verified file atomically replaces every allowed ambient key,
 * including deleting allowed keys that the file omits. Every other filesystem condition fails
 * closed. All bytes and keys are verified before the target environment is changed.
 */
export function loadPrivateEnvironmentFile({
  allowedKeys,
  environment,
  file,
  mode,
}: LoadPrivateEnvironmentFileOptions): boolean {
  assertLoadOptions({ allowedKeys, environment, file, mode });
  const effectiveUserId = process.geteuid?.();
  const noFollow = fs.constants.O_NOFOLLOW;
  const nonBlock = fs.constants.O_NONBLOCK;
  if (
    effectiveUserId === undefined ||
    noFollow === undefined ||
    nonBlock === undefined
  ) {
    throw new Error(
      "Private environment loading requires POSIX ownership, O_NOFOLLOW, and O_NONBLOCK.",
    );
  }

  let descriptor: number;
  try {
    descriptor = fs.openSync(file, fs.constants.O_RDONLY | noFollow | nonBlock);
  } catch (error) {
    if (isErrno(error, "ENOENT") && mode === "optional-ambient") return false;
    if (isErrno(error, "ENOENT")) {
      throw new Error(
        `Required private environment file ${path.basename(file)} is absent.`,
        { cause: error },
      );
    }
    throw privateFileError(file, error);
  }

  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    assertPrivateEnvironmentFile(before, file, effectiveUserId);
    assertPrivateEnvironmentFileSize(before.size, file);

    const bytes = Buffer.allocUnsafe(MAX_PRIVATE_ENVIRONMENT_FILE_BYTES + 1);
    let offset = 0;
    while (offset <= MAX_PRIVATE_ENVIRONMENT_FILE_BYTES) {
      const bytesRead = fs.readSync(
        descriptor,
        bytes,
        offset,
        bytes.length - offset,
        null,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    if (offset > MAX_PRIVATE_ENVIRONMENT_FILE_BYTES) {
      throw privateEnvironmentFileTooLarge(file);
    }

    const after = fs.fstatSync(descriptor, { bigint: true });
    let currentPath: fs.BigIntStats;
    try {
      currentPath = fs.lstatSync(file, { bigint: true });
    } catch (error) {
      throw privateEnvironmentFileChanged(file, error);
    }
    if (
      BigInt(offset) !== before.size ||
      !sameSnapshot(before, after) ||
      !sameSnapshot(before, currentPath)
    ) {
      throw privateEnvironmentFileChanged(file);
    }

    let content: string;
    try {
      content = UTF8_DECODER.decode(bytes.subarray(0, offset));
    } catch (error) {
      throw new Error(
        `Private environment file ${path.basename(file)} must be valid UTF-8.`,
        { cause: error },
      );
    }
    const parsed = parseEnv(content);
    for (const [name, value] of Object.entries(parsed)) {
      if (
        typeof value !== "string" ||
        name.includes("\0") ||
        value.includes("\0")
      ) {
        throw new Error(
          `Private environment file ${path.basename(file)} must not contain NUL in parsed names or values.`,
        );
      }
    }
    if (Object.hasOwn(parsed, "NODE_OPTIONS")) {
      throw new Error("Private environment files must not set NODE_OPTIONS.");
    }
    for (const name of Object.keys(parsed).sort()) {
      if (!allowedKeys.has(name)) {
        throw new UnsupportedPrivateEnvironmentKeyError(file, name);
      }
    }
    if (mode === "required-authoritative") {
      for (const name of allowedKeys) delete environment[name];
      Object.assign(environment, parsed);
    } else {
      for (const [name, value] of Object.entries(parsed)) {
        if (environment[name] === undefined) environment[name] = value;
      }
    }
    return true;
  } finally {
    fs.closeSync(descriptor);
  }
}

function assertLoadOptions({
  allowedKeys,
  environment,
  file,
  mode,
}: LoadPrivateEnvironmentFileOptions): void {
  if (!path.isAbsolute(file)) {
    throw new TypeError("Private environment file must use an absolute path.");
  }
  if (!environment || typeof environment !== "object") {
    throw new TypeError(
      "Private environment target must be an environment object.",
    );
  }
  if (!(allowedKeys instanceof Set) || allowedKeys.size === 0) {
    throw new TypeError(
      "Private environment allowedKeys must be a non-empty Set.",
    );
  }
  if (mode !== "optional-ambient" && mode !== "required-authoritative") {
    throw new TypeError(
      "Private environment mode must be optional-ambient or required-authoritative.",
    );
  }
  for (const name of allowedKeys) {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
      throw new TypeError(
        "Private environment allowedKeys must contain canonical environment variable names.",
      );
    }
  }
}

function assertPrivateEnvironmentFile(
  metadata: fs.BigIntStats,
  file: string,
  effectiveUserId: number,
): void {
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1n ||
    metadata.uid !== BigInt(effectiveUserId) ||
    (metadata.mode & 0o777n) !== BigInt(PRIVATE_FILE_MODE)
  ) {
    throw privateFileError(file);
  }
}

function assertPrivateEnvironmentFileSize(size: bigint, file: string): void {
  if (size > BigInt(MAX_PRIVATE_ENVIRONMENT_FILE_BYTES)) {
    throw privateEnvironmentFileTooLarge(file);
  }
}

function sameSnapshot(left: fs.BigIntStats, right: fs.BigIntStats): boolean {
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

function privateFileError(file: string, cause?: unknown): Error {
  return new Error(
    `Private environment file ${path.basename(file)} must be one owner-owned mode-0600 regular file with one link and no final symlink.`,
    cause === undefined ? undefined : { cause },
  );
}

function privateEnvironmentFileTooLarge(file: string): Error {
  return new Error(
    `Private environment file ${path.basename(file)} exceeds 64 KiB.`,
  );
}

function privateEnvironmentFileChanged(file: string, cause?: unknown): Error {
  return new Error(
    `Private environment file ${path.basename(file)} changed while loading.`,
    cause === undefined ? undefined : { cause },
  );
}

function isErrno(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}
