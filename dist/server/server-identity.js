import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync, } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { TextDecoder } from "node:util";
import { optionalEnvironmentValue } from "./configuration.js";
export const SERVER_IDENTITY_PATH = "/cx-server.json";
export const SERVER_IDENTITY_ENVIRONMENT_KEY = "CX_SERVER_RELEASE_IDENTITY_FILE";
export const MAX_SERVER_IDENTITY_BYTES = 64 * 1024;
export const MAX_SERVER_RELEASE_ARTIFACT_BYTES = 512 * 1024 * 1024;
export const MAX_SERVER_RELEASE_ARTIFACT_ENTRIES = 100_000;
export const MAX_SERVER_RELEASE_WORKERS = 64;
const RELEASE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/i;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const REVISION_PATTERN = /^[a-f0-9]{40,64}$/;
const ENTRYPOINT_PART_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;
const sourcePins = new WeakMap();
export function parseServerReleaseArtifactDeclaration(value) {
    const declaration = plainObject(value, "Server release artifact declaration");
    assertExactKeys(declaration, ["entrypoint", "workers"]);
    const entrypoint = safeEntrypoint(declaration["entrypoint"], "entrypoint");
    const workers = workerIdentities(declaration["workers"], entrypoint, false);
    return Object.freeze({ entrypoint, workers });
}
export function parseServerReleaseIdentity(value) {
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
        throw new Error("Server release identity serverBuildId must match artifactDigest.");
    }
    const revision = stringMatching(identity["revision"], REVISION_PATTERN, "revision");
    const sourceFingerprint = sha256(identity["sourceFingerprint"], "sourceFingerprint");
    if (typeof identity["sourceDirty"] !== "boolean") {
        throw new Error("Server release identity sourceDirty must be a boolean.");
    }
    const createdAt = isoTimestamp(identity["createdAt"], "createdAt");
    const entrypoint = safeEntrypoint(identity["entrypoint"], "entrypoint");
    const workers = workerIdentities(identity["workers"], entrypoint);
    if (identity["nodeMajor"] !== 26) {
        throw new Error("Server release identity nodeMajor must be 26.");
    }
    const artifactFiles = boundedInteger(identity["artifactFiles"], "artifactFiles", MAX_SERVER_RELEASE_ARTIFACT_ENTRIES);
    const artifactBytes = boundedInteger(identity["artifactBytes"], "artifactBytes", MAX_SERVER_RELEASE_ARTIFACT_BYTES);
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
export function loadServerReleaseIdentity({ environment = process.env, identityFile, required = false, } = {}) {
    const selectedFile = selectServerReleaseIdentityFile({
        environment,
        ...(identityFile === undefined ? {} : { identityFile }),
    });
    if (selectedFile === undefined) {
        if (required) {
            throw new Error(`Server release identity requires ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`);
        }
        return undefined;
    }
    const opened = openServerReleaseIdentityFile(selectedFile);
    try {
        const identity = parseServerReleaseIdentityJson(opened.source);
        sourcePins.set(identity, sourcePin(opened));
        return identity;
    }
    finally {
        closeSync(opened.descriptor);
    }
}
/**
 * Reopen and retain the exact identity file that produced an already-pinned release identity.
 * Parsed lookalikes are rejected: the expected object must originate from
 * loadServerReleaseIdentity(), and its path, inode snapshot, bytes, and exact parsed identity must
 * all still match when the lease is acquired.
 */
export function acquireServerReleaseIdentityFileLease({ environment = process.env, identity, identityFile, }) {
    const expectedIdentity = parseServerReleaseIdentity(identity);
    const expectedSource = sourcePins.get(identity);
    if (!expectedSource) {
        throw new Error("Server release identity lease requires the exact identity loaded from its configured file.");
    }
    const selectedFile = selectServerReleaseIdentityFile({
        environment,
        ...(identityFile === undefined ? {} : { identityFile }),
    });
    if (selectedFile === undefined) {
        throw new Error(`Server release identity lease requires ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`);
    }
    const opened = openServerReleaseIdentityFile(selectedFile);
    try {
        const currentIdentity = parseServerReleaseIdentityJson(opened.source);
        if (opened.configuredFile !== expectedSource.configuredFile ||
            opened.canonicalFile !== expectedSource.canonicalFile ||
            !sameServerReleaseIdentityFileSnapshot(opened.snapshot, expectedSource.snapshot) ||
            opened.source !== expectedSource.source ||
            !sameServerReleaseIdentity(currentIdentity, expectedIdentity)) {
            throw new Error("Server release identity changed between startup and worker lease acquisition.");
        }
        let descriptor = opened.descriptor;
        return Object.freeze({
            get closed() {
                return descriptor === undefined;
            },
            close() {
                if (descriptor === undefined)
                    return;
                const ownedDescriptor = descriptor;
                descriptor = undefined;
                closeSync(ownedDescriptor);
            },
            identityFile: opened.canonicalFile,
        });
    }
    catch (error) {
        try {
            closeSync(opened.descriptor);
        }
        catch (closeError) {
            throw new AggregateError([error, closeError], "Server release identity lease failed and its descriptor could not be closed.");
        }
        throw error;
    }
}
export function serverReleaseIdentityMiddleware(identity) {
    const pinned = parseServerReleaseIdentity(identity);
    return (_request, response) => {
        response.setHeader("Cache-Control", "no-store");
        response.status(200).type("application/json").json(pinned);
    };
}
function openServerReleaseIdentityFile(file) {
    if (!isAbsolute(file)) {
        throw new Error("Server release identity file must be an absolute path.");
    }
    const configuredFile = resolve(file);
    let configuredEntry;
    let canonicalFile;
    try {
        configuredEntry = lstatSync(configuredFile, { bigint: true });
        if (configuredEntry.isSymbolicLink() || !configuredEntry.isFile()) {
            throw new Error(`Server release identity must be a regular non-symlink file: ${configuredFile}`);
        }
        canonicalFile = realpathSync(configuredFile);
        const canonicalEntry = lstatSync(canonicalFile, { bigint: true });
        if (canonicalEntry.isSymbolicLink() ||
            !canonicalEntry.isFile() ||
            !sameServerReleaseIdentityFileIdentity(configuredEntry, canonicalEntry)) {
            throw new Error("Server release identity changed while its canonical path was resolved.");
        }
    }
    catch (error) {
        if (error instanceof Error &&
            (error.message.startsWith("Server release identity must be") ||
                error.message.startsWith("Server release identity changed"))) {
            throw error;
        }
        throw new Error(`Server release identity file is missing or unsafe: ${configuredFile}`, { cause: error });
    }
    let descriptor;
    try {
        descriptor = openSync(canonicalFile, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    }
    catch (error) {
        throw new Error(`Server release identity file is missing or unsafe: ${configuredFile}`, { cause: error });
    }
    try {
        const before = fstatSync(descriptor, { bigint: true });
        if (!before.isFile() ||
            !sameServerReleaseIdentityFileIdentity(configuredEntry, before)) {
            throw new Error("Server release identity changed while it was opened.");
        }
        if (before.size < 2n) {
            throw new Error("Server release identity file must contain JSON.");
        }
        if (before.size > BigInt(MAX_SERVER_IDENTITY_BYTES)) {
            throw new Error(`Server release identity exceeds ${MAX_SERVER_IDENTITY_BYTES} bytes.`);
        }
        const content = Buffer.allocUnsafe(MAX_SERVER_IDENTITY_BYTES + 1);
        let offset = 0;
        while (offset <= MAX_SERVER_IDENTITY_BYTES) {
            const count = readSync(descriptor, content, offset, content.length - offset, null);
            if (count === 0)
                break;
            offset += count;
        }
        if (offset > MAX_SERVER_IDENTITY_BYTES) {
            throw new Error(`Server release identity exceeds ${MAX_SERVER_IDENTITY_BYTES} bytes.`);
        }
        const after = fstatSync(descriptor, { bigint: true });
        const currentConfigured = lstatSync(configuredFile, { bigint: true });
        const currentCanonical = lstatSync(canonicalFile, { bigint: true });
        if (BigInt(offset) !== before.size ||
            !sameServerReleaseIdentityFileSnapshot(before, after) ||
            !sameServerReleaseIdentityFileSnapshot(before, currentConfigured) ||
            !sameServerReleaseIdentityFileSnapshot(before, currentCanonical) ||
            realpathSync(configuredFile) !== canonicalFile) {
            throw new Error("Server release identity changed while it was read.");
        }
        let source;
        try {
            source = new TextDecoder("utf-8", { fatal: true }).decode(content.subarray(0, offset));
        }
        catch (error) {
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
    }
    catch (error) {
        try {
            closeSync(descriptor);
        }
        catch (closeError) {
            throw new AggregateError([error, closeError], "Server release identity loading failed and its descriptor could not be closed.");
        }
        throw error;
    }
}
function parseServerReleaseIdentityJson(source) {
    let parsed;
    try {
        parsed = JSON.parse(source);
    }
    catch (error) {
        throw new Error("Server release identity file must contain valid JSON.", {
            cause: error,
        });
    }
    return parseServerReleaseIdentity(parsed);
}
function selectServerReleaseIdentityFile({ environment, identityFile, }) {
    const environmentFile = optionalEnvironmentValue(environment, SERVER_IDENTITY_ENVIRONMENT_KEY);
    if (identityFile !== undefined && environmentFile !== undefined) {
        throw new Error(`Configure the server identity once, not in both options and ${SERVER_IDENTITY_ENVIRONMENT_KEY}.`);
    }
    return identityFile ?? environmentFile;
}
function sourcePin(opened) {
    return Object.freeze({
        canonicalFile: opened.canonicalFile,
        configuredFile: opened.configuredFile,
        snapshot: opened.snapshot,
        source: opened.source,
    });
}
function serverReleaseIdentityFileSnapshot(value) {
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
function sameServerReleaseIdentityFileIdentity(left, right) {
    return left.dev === right.dev && left.ino === right.ino;
}
function sameServerReleaseIdentityFileSnapshot(left, right) {
    return (sameServerReleaseIdentityFileIdentity(left, right) &&
        left.mode === right.mode &&
        left.nlink === right.nlink &&
        left.size === right.size &&
        left.mtimeNs === right.mtimeNs &&
        left.ctimeNs === right.ctimeNs);
}
function sameServerReleaseIdentity(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function workerIdentities(value, webEntrypoint, requireSorted = true) {
    if (!Array.isArray(value) || value.length > MAX_SERVER_RELEASE_WORKERS) {
        throw new Error(`Server release identity workers must contain at most ${MAX_SERVER_RELEASE_WORKERS} entries.`);
    }
    const keys = new Set();
    const entrypoints = new Set([webEntrypoint]);
    const workers = value.map((candidate, index) => {
        const worker = plainObject(candidate, `workers[${index}]`);
        assertExactKeys(worker, ["entrypoint", "key"]);
        const key = releaseIdentifier(worker["key"], `workers[${index}].key`);
        const entrypoint = safeEntrypoint(worker["entrypoint"], `workers[${index}].entrypoint`);
        if (keys.has(key) || entrypoints.has(entrypoint)) {
            throw new Error("Server release worker identities must be unique.");
        }
        keys.add(key);
        entrypoints.add(entrypoint);
        return Object.freeze({ key, entrypoint });
    });
    const sorted = [...workers].sort((left, right) => left.key.localeCompare(right.key));
    if (requireSorted &&
        workers.some((worker, index) => worker !== sorted[index])) {
        throw new Error("Server release workers must be sorted by key.");
    }
    return Object.freeze(requireSorted ? workers : sorted);
}
function safeEntrypoint(value, label) {
    if (typeof value !== "string") {
        throw new Error(`Server release identity ${label} is invalid.`);
    }
    const parts = value.split("/");
    if (parts.length === 0 ||
        parts.some((part) => part === "." || part === ".." || !ENTRYPOINT_PART_PATTERN.test(part)) ||
        !/\.(?:js|mjs)$/.test(parts.at(-1) ?? "")) {
        throw new Error(`Server release identity ${label} must stay inside the artifact.`);
    }
    return value;
}
function releaseIdentifier(value, label) {
    return stringMatching(value, RELEASE_ID_PATTERN, label);
}
function sha256(value, label) {
    return stringMatching(value, SHA256_PATTERN, label);
}
function stringMatching(value, pattern, label) {
    if (typeof value !== "string" || !pattern.test(value)) {
        throw new Error(`Server release identity ${label} is invalid.`);
    }
    return value;
}
function isoTimestamp(value, label) {
    if (typeof value !== "string") {
        throw new Error(`Server release identity ${label} is invalid.`);
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
        throw new Error(`Server release identity ${label} is invalid.`);
    }
    return value;
}
function boundedInteger(value, label, maximum) {
    if (!Number.isSafeInteger(value) ||
        value < 1 ||
        value > maximum) {
        throw new Error(`Server release identity ${label} must be an integer from 1 to ${maximum}.`);
    }
    return value;
}
function plainObject(value, label) {
    if (!value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Object.prototype) {
        throw new Error(`${label} must be a plain object.`);
    }
    return value;
}
function assertExactKeys(value, expected) {
    const actual = Object.keys(value).sort((left, right) => left.localeCompare(right));
    const sortedExpected = [...expected].sort((left, right) => left.localeCompare(right));
    if (actual.length !== sortedExpected.length ||
        actual.some((key, index) => key !== sortedExpected[index])) {
        throw new Error("Server release identity fields are invalid.");
    }
}
