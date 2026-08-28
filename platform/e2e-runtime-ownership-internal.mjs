import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { URL as NodeURL } from "node:url";
import { E2E_DYNAMIC_PORT_RANGE } from "./e2e-contract.mjs";
import {
  exactLoopbackOrigin,
  validatePort,
} from "./e2e-network-orchestration-internal.mjs";

export const E2E_OWNER_MARKER_NAME = ".cx-e2e-owner.json";
export const E2E_LEASE_DESCRIPTOR = 17;
export const MARKER_SCHEMA_VERSION = 1;

const E2E_LEASE_NAME = ".cx-e2e-lease";
const E2E_PROCESS_GROUP_DIRECTORY = ".cx-e2e-process-groups";
const RUN_LEASES = new Map();
const PROXY_RECEIPT_NAME = ".cx-e2e-proxy.json";
const MARKER_KEYS = Object.freeze(
  [
    "baseUrl",
    "ownerNonce",
    "ownerPid",
    "port",
    "productId",
    "root",
    "runTokenHash",
    "schemaVersion",
    "tempParent",
  ].sort(),
);
const PROXY_RECEIPT_KEYS = Object.freeze(
  [
    "ownerNonce",
    "ownerPid",
    "proxyPort",
    "proxyUrl",
    "root",
    "schemaVersion",
  ].sort(),
);
const PRODUCT_ID = /^[a-z][a-z0-9-]{1,47}$/;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function releaseOwnedLease(runtime) {
  const lease = RUN_LEASES.get(runtime.root);
  if (!lease) return;
  validateOwnedLeaseRecord(lease);
  closeSync(lease.descriptor);
  RUN_LEASES.delete(runtime.root);
}

export function validateOwnedE2ERuntime({
  environment = process.env,
  productId,
}) {
  assertProductId(productId);
  const root = requiredEnvironment(environment, "CX_E2E_TEMP_ROOT");
  const tempParent = requiredEnvironment(environment, "CX_E2E_TEMP_PARENT");
  const markerPath = requiredEnvironment(environment, "CX_E2E_OWNER_MARKER");
  const ownerNonce = requiredEnvironment(environment, "CX_E2E_OWNER_NONCE");
  const ownerPid = positiveInteger(
    requiredEnvironment(environment, "CX_E2E_OWNER_PID"),
    "CX_E2E_OWNER_PID",
  );
  const port = positiveInteger(
    requiredEnvironment(environment, "CX_E2E_PORT"),
    "CX_E2E_PORT",
  );
  const baseUrl = requiredEnvironment(environment, "CX_E2E_BASE_URL");
  const proxyUrl = requiredEnvironment(environment, "CX_E2E_PROXY_URL");
  const runToken = requiredEnvironment(environment, "CX_E2E_RUN_TOKEN");
  let parsedProxy;
  try {
    parsedProxy = new NodeURL(proxyUrl);
  } catch {
    throw new Error(`${productId} E2E runtime identity is invalid.`);
  }
  const proxyPort = Number(parsedProxy.port);
  if (
    requiredEnvironment(environment, "CX_E2E_PRODUCT_ID") !== productId ||
    !/^[0-9a-f]{64}$/u.test(runToken) ||
    baseUrl !== `http://127.0.0.1:${port}` ||
    !UUID_V4.test(ownerNonce) ||
    parsedProxy.protocol !== "http:" ||
    parsedProxy.hostname !== "127.0.0.1" ||
    !parsedProxy.port ||
    !Number.isInteger(proxyPort) ||
    proxyPort < E2E_DYNAMIC_PORT_RANGE.first ||
    proxyPort > E2E_DYNAMIC_PORT_RANGE.last ||
    parsedProxy.port === String(port) ||
    parsedProxy.pathname !== "/" ||
    parsedProxy.search ||
    parsedProxy.hash ||
    parsedProxy.origin !== proxyUrl
  ) {
    throw new Error(`${productId} E2E runtime identity is invalid.`);
  }
  validatePort(port);
  const runtime = {
    baseUrl,
    markerPath,
    ownerNonce,
    ownerPid,
    port,
    productId,
    proxyUrl,
    root,
    runtimeTemp: path.join(root, "tmp"),
    tempParent,
  };
  validateRuntime(runtime, true, runToken);
  validateProxyReceipt(runtime);
  return Object.freeze(runtime);
}

export function createOwnedE2ERuntime({ port, productId, proxyUrl }) {
  assertProductId(productId);
  validatePort(port);
  const tempParent = realpathSync("/tmp");
  const ownerPid = process.pid;
  const ownerNonce = randomUUID();
  const runToken = randomBytes(32).toString("hex");
  let leaseDescriptor;
  const root = realpathSync(
    mkdtempSync(
      path.join(tempParent, `${productId}-e2e-${ownerPid}-${ownerNonce}-`),
    ),
  );
  const runtime = {
    baseUrl: `http://127.0.0.1:${port}`,
    markerPath: path.join(root, E2E_OWNER_MARKER_NAME),
    ownerNonce,
    ownerPid,
    port,
    productId,
    root,
    runtimeTemp: path.join(root, "tmp"),
    tempParent,
  };
  try {
    chmodSync(root, 0o700);
    const marker = {
      baseUrl: runtime.baseUrl,
      ownerNonce,
      ownerPid,
      port,
      productId,
      root,
      runTokenHash: sha256Hex(runToken),
      schemaVersion: MARKER_SCHEMA_VERSION,
      tempParent,
    };
    const descriptor = openSync(
      runtime.markerPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    try {
      writeFileSync(descriptor, `${JSON.stringify(marker)}\n`, "utf8");
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    chmodSync(runtime.markerPath, 0o600);
    const leasePath = path.join(runtime.root, E2E_LEASE_NAME);
    leaseDescriptor = openSync(
      leasePath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_RDWR |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    );
    fsyncSync(leaseDescriptor);
    chmodSync(leasePath, 0o600);
    const leaseMetadata = validateLeaseFile(leasePath);
    const descriptorMetadata = fstatSync(leaseDescriptor);
    if (
      leaseMetadata.dev !== descriptorMetadata.dev ||
      leaseMetadata.ino !== descriptorMetadata.ino
    ) {
      throw new Error("E2E runtime lease descriptor is not its owned file.");
    }
    RUN_LEASES.set(
      root,
      Object.freeze({
        descriptor: leaseDescriptor,
        dev: leaseMetadata.dev,
        ino: leaseMetadata.ino,
        path: leasePath,
        root,
        runToken,
      }),
    );
    mkdirSync(path.join(root, E2E_PROCESS_GROUP_DIRECTORY), { mode: 0o700 });
    mkdirSync(runtime.runtimeTemp, { mode: 0o700 });
    validateRuntime(runtime, false);
    const owned = Object.freeze(runtime);
    return proxyUrl === undefined ? owned : sealOwnedE2EProxy(owned, proxyUrl);
  } catch (error) {
    RUN_LEASES.delete(root);
    if (leaseDescriptor !== undefined) closeSync(leaseDescriptor);
    if (existsSync(root)) rmSync(root, { force: true, recursive: true });
    throw error;
  }
}

export function removeOwnedE2ERuntime(runtime) {
  if (runtime.ownerPid !== process.pid) {
    throw new Error("Only the E2E wrapper owner can remove its runtime root.");
  }
  validateRuntime(runtime, false);
  const lease = ownedLeaseForRoot(runtime.root);
  closeSync(lease.descriptor);
  RUN_LEASES.delete(runtime.root);
  rmSync(runtime.root, { force: false, recursive: true });
  if (existsSync(runtime.root)) {
    throw new Error("Owned E2E runtime cleanup did not complete.");
  }
}

export async function withOwnedE2ERuntime(options, operation) {
  const runtime = createOwnedE2ERuntime(options);
  let result;
  let primaryError;
  try {
    result = await operation(runtime);
  } catch (error) {
    primaryError = error;
  }
  try {
    removeOwnedE2ERuntime(runtime);
  } catch (error) {
    primaryError = primaryError
      ? new AggregateError(
          [primaryError, error],
          "E2E failed and its owned root could not be removed.",
        )
      : error;
  }
  if (primaryError) throw primaryError;
  return result;
}

export function validateRuntime(runtime, requireLiveOwner, suppliedRunToken) {
  const canonicalTempParent = realpathSync("/tmp");
  const root = lstatSync(runtime.root);
  if (
    !root.isDirectory() ||
    root.isSymbolicLink() ||
    root.uid !== currentUid() ||
    (root.mode & 0o777) !== 0o700 ||
    realpathSync(runtime.root) !== runtime.root ||
    path.dirname(runtime.root) !== runtime.tempParent ||
    runtime.tempParent !== canonicalTempParent
  ) {
    throw new Error("E2E runtime root is not one owned private directory.");
  }
  if (runtime.runtimeTemp !== path.join(runtime.root, "tmp")) {
    throw new Error("E2E process temp escaped its runtime root.");
  }
  const runtimeTemp = lstatSync(runtime.runtimeTemp);
  if (
    !runtimeTemp.isDirectory() ||
    runtimeTemp.isSymbolicLink() ||
    runtimeTemp.uid !== currentUid() ||
    (runtimeTemp.mode & 0o777) !== 0o700 ||
    realpathSync(runtime.runtimeTemp) !== runtime.runtimeTemp
  ) {
    throw new Error("E2E process temp is not one owned private directory.");
  }
  const prefix = `${runtime.productId}-e2e-${runtime.ownerPid}-${runtime.ownerNonce}-`;
  const name = path.basename(runtime.root);
  if (
    !name.startsWith(prefix) ||
    !/^[A-Za-z0-9]{6}$/.test(name.slice(prefix.length))
  ) {
    throw new Error("E2E runtime root does not match its owner identity.");
  }
  if (runtime.markerPath !== path.join(runtime.root, E2E_OWNER_MARKER_NAME)) {
    throw new Error("E2E ownership marker escaped its runtime root.");
  }
  const marker = lstatSync(runtime.markerPath);
  if (
    !marker.isFile() ||
    marker.isSymbolicLink() ||
    marker.uid !== currentUid() ||
    (marker.mode & 0o777) !== 0o600 ||
    marker.nlink !== 1 ||
    marker.size < 2 ||
    marker.size > 4096
  ) {
    throw new Error("E2E ownership marker is not one private file.");
  }
  const parsed = readJson(runtime.markerPath, "E2E ownership marker");
  const runToken = suppliedRunToken ?? RUN_LEASES.get(runtime.root)?.runToken;
  if (
    !exactKeys(parsed, MARKER_KEYS) ||
    parsed.schemaVersion !== MARKER_SCHEMA_VERSION ||
    parsed.productId !== runtime.productId ||
    parsed.ownerPid !== runtime.ownerPid ||
    parsed.ownerNonce !== runtime.ownerNonce ||
    parsed.root !== runtime.root ||
    !/^[0-9a-f]{64}$/u.test(runToken ?? "") ||
    parsed.runTokenHash !== sha256Hex(runToken) ||
    parsed.tempParent !== runtime.tempParent ||
    parsed.port !== runtime.port ||
    parsed.baseUrl !== runtime.baseUrl
  ) {
    throw new Error("E2E ownership marker no longer matches its owner.");
  }
  validateLeaseFile(path.join(runtime.root, E2E_LEASE_NAME));
  validateProcessGroupDirectory(runtime);
  if (requireLiveOwner) {
    try {
      process.kill(runtime.ownerPid, 0);
    } catch {
      throw new Error("E2E wrapper owner is no longer running.");
    }
  }
}

export function validateProcessGroupDirectory(runtime) {
  const directoryPath = path.join(runtime.root, E2E_PROCESS_GROUP_DIRECTORY);
  const metadata = lstatSync(directoryPath);
  if (
    !metadata.isDirectory() ||
    metadata.isSymbolicLink() ||
    metadata.uid !== currentUid() ||
    (metadata.mode & 0o777) !== 0o700 ||
    realpathSync(directoryPath) !== directoryPath
  ) {
    throw new Error(
      "E2E process-group receipt directory is not one owned private directory.",
    );
  }
  return directoryPath;
}

function validateLeaseFile(leasePath) {
  const metadata = lstatSync(leasePath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.uid !== currentUid() ||
    (metadata.mode & 0o777) !== 0o600 ||
    metadata.nlink !== 1 ||
    metadata.size !== 0
  ) {
    throw new Error("E2E runtime lease is not one private empty file.");
  }
  return metadata;
}

export function ownedLeaseForRoot(root) {
  const lease = RUN_LEASES.get(root);
  if (!lease) throw new Error("The E2E runtime lease is unavailable.");
  return validateOwnedLeaseRecord(lease);
}

export function validateOwnedLeaseRecord(lease) {
  if (
    !lease ||
    lease.root !== path.dirname(lease.path) ||
    lease.path !== path.join(lease.root, E2E_LEASE_NAME) ||
    !/^[0-9a-f]{64}$/u.test(lease.runToken ?? "")
  ) {
    throw new Error("The E2E runtime lease record is invalid.");
  }
  const pathMetadata = validateLeaseFile(lease.path);
  let descriptorMetadata;
  try {
    descriptorMetadata = fstatSync(lease.descriptor);
  } catch (error) {
    throw new Error("The E2E wrapper lost its runtime lease descriptor.", {
      cause: error,
    });
  }
  if (
    pathMetadata.dev !== lease.dev ||
    pathMetadata.ino !== lease.ino ||
    descriptorMetadata.dev !== lease.dev ||
    descriptorMetadata.ino !== lease.ino
  ) {
    throw new Error(
      "The E2E runtime lease path no longer matches its wrapper descriptor.",
    );
  }
  return lease;
}

export function sealOwnedE2EProxy(runtime, proxyUrl) {
  validateRuntime(runtime, false);
  const proxy = exactLoopbackOrigin(proxyUrl, "owned E2E proxy");
  const proxyPort = Number(proxy.port);
  if (
    proxy.origin === runtime.baseUrl ||
    proxyPort < E2E_DYNAMIC_PORT_RANGE.first ||
    proxyPort > E2E_DYNAMIC_PORT_RANGE.last
  ) {
    throw new Error(
      "Owned E2E proxy must use a distinct port in the dynamic E2E range.",
    );
  }
  const receiptPath = path.join(runtime.root, PROXY_RECEIPT_NAME);
  const receipt = {
    ownerNonce: runtime.ownerNonce,
    ownerPid: runtime.ownerPid,
    proxyPort,
    proxyUrl: proxy.origin,
    root: runtime.root,
    schemaVersion: MARKER_SCHEMA_VERSION,
  };
  const descriptor = openSync(
    receiptPath,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  try {
    writeFileSync(descriptor, `${JSON.stringify(receipt)}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  chmodSync(receiptPath, 0o600);
  const sealed = Object.freeze({ ...runtime, proxyUrl: proxy.origin });
  validateProxyReceipt(sealed);
  return sealed;
}

function validateProxyReceipt(runtime) {
  const receiptPath = path.join(runtime.root, PROXY_RECEIPT_NAME);
  const metadata = lstatSync(receiptPath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.uid !== currentUid() ||
    (metadata.mode & 0o777) !== 0o600 ||
    metadata.nlink !== 1 ||
    metadata.size < 2 ||
    metadata.size > 4096
  ) {
    throw new Error("E2E proxy receipt is not one private file.");
  }
  const parsed = readJson(receiptPath, "E2E proxy receipt");
  const proxy = exactLoopbackOrigin(runtime.proxyUrl, "owned E2E proxy");
  const proxyPort = Number(proxy.port);
  if (
    !exactKeys(parsed, PROXY_RECEIPT_KEYS) ||
    parsed.schemaVersion !== MARKER_SCHEMA_VERSION ||
    parsed.ownerPid !== runtime.ownerPid ||
    parsed.ownerNonce !== runtime.ownerNonce ||
    parsed.root !== runtime.root ||
    parsed.proxyUrl !== proxy.origin ||
    parsed.proxyPort !== proxyPort ||
    proxyPort < E2E_DYNAMIC_PORT_RANGE.first ||
    proxyPort > E2E_DYNAMIC_PORT_RANGE.last ||
    proxy.origin === runtime.baseUrl
  ) {
    throw new Error("E2E proxy receipt no longer matches its owner.");
  }
}

export function requiredEnvironment(environment, name) {
  const value = environment[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required for hermetic E2E.`);
  }
  return value;
}

export function positiveInteger(value, label) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`${label} must be a canonical positive safe integer.`);
  }
  return Number(value);
}

export function assertProductId(productId) {
  if (!PRODUCT_ID.test(productId)) {
    throw new Error(
      "E2E product ID must be one canonical lowercase identifier.",
    );
  }
}

export function currentUid() {
  if (typeof process.getuid !== "function") {
    throw new Error("Hermetic E2E ownership requires a POSIX user ID.");
  }
  return process.getuid();
}

export function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return (
    keys.length === expected.length &&
    keys.every((key, index) => key === expected[index])
  );
}

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function readJson(filename, label) {
  try {
    return JSON.parse(readFileSync(filename, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
}
