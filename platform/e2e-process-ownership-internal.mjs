import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL, URL as NodeURL } from "node:url";
import { delay } from "./e2e-network-orchestration-internal.mjs";
import {
  E2E_LEASE_DESCRIPTOR,
  MARKER_SCHEMA_VERSION,
  currentUid,
  exactKeys,
  ownedLeaseForRoot,
  readJson,
  validateOwnedLeaseRecord,
  validateProcessGroupDirectory,
  validateRuntime,
} from "./e2e-runtime-ownership-internal.mjs";

export const NETWORK_GUARD_PATH = fileURLToPath(
  new NodeURL("./e2e-network-guard.mjs", import.meta.url),
);
export const TRUSTED_NETWORK_GUARD_NODE_OPTIONS = `--import=${pathToFileURL(NETWORK_GUARD_PATH).href}`;
export const PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY =
  "pnpm_config_verify_deps_before_run";
export const PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE = "error";

const PROCESS_GROUP_LEASES = new WeakMap();
const PROCESS_GROUP_RECEIPTS = new WeakMap();
const PROCESS_GROUP_RECEIPT_KEYS = Object.freeze(
  [
    "commandName",
    "ownerNonce",
    "ownerPid",
    "pgid",
    "pid",
    "root",
    "schemaVersion",
    "state",
    "startedAt",
  ].sort(),
);
const FORBIDDEN_ENVIRONMENT_KEYS = Object.freeze(
  new Set([
    "ALL_PROXY",
    "BASH_ENV",
    "CDPATH",
    "ELECTRON_RUN_AS_NODE",
    "ENV",
    "FPATH",
    "GLOBIGNORE",
    "HOME",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "IFS",
    "INPUTRC",
    "JAVA_TOOL_OPTIONS",
    "NODE_OPTIONS",
    "NODE_PATH",
    "NO_PROXY",
    "PERL5LIB",
    "PROMPT_COMMAND",
    "PS4",
    "PYTHONPATH",
    "RUBYLIB",
    "SHELL",
    "SHELLOPTS",
    "SSL_CERT_DIR",
    "SSL_CERT_FILE",
    "SSLKEYLOGFILE",
    "ZDOTDIR",
    "_JAVA_OPTIONS",
  ]),
);
const FORBIDDEN_ENVIRONMENT_PREFIXES = Object.freeze([
  "COREPACK_",
  "DYLD_",
  "LD_",
  "NPM_",
  "PNPM_",
  "PLAYWRIGHT_",
  "PW_",
]);

export function recordOwnedDetachedProcessGroup({ pid, runToken, runtime }) {
  if (process.platform === "win32") return undefined;
  validateRuntime(runtime, true, runToken);
  if (!Number.isSafeInteger(pid) || pid <= 1) {
    throw new Error("Detached E2E process did not expose one valid PID.");
  }
  const pendingReceipt = {
    commandName: "",
    ownerNonce: runtime.ownerNonce,
    ownerPid: runtime.ownerPid,
    pgid: pid,
    pid,
    root: runtime.root,
    schemaVersion: MARKER_SCHEMA_VERSION,
    startedAt: "",
    state: "pending",
  };
  const directoryPath = validateProcessGroupDirectory(runtime);
  const receiptPath = path.join(directoryPath, `${pid}.json`);
  const descriptor = openSync(
    receiptPath,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  try {
    writeFileSync(descriptor, `${JSON.stringify(pendingReceipt)}\n`, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  chmodSync(receiptPath, 0o600);
  const directoryDescriptor = openSync(directoryPath, constants.O_RDONLY);
  try {
    fsyncSync(directoryDescriptor);
  } finally {
    closeSync(directoryDescriptor);
  }
  const identity = inspectExactProcessIdentity(pid);
  if (!identity || identity.pgid !== pid || identity.uid !== currentUid()) {
    throw new Error(
      `Detached E2E process ${pid} is not its own owned process-group leader.`,
    );
  }
  const receipt = Object.freeze({
    ...pendingReceipt,
    commandName: identity.commandName,
    startedAt: identity.startedAt,
    state: "sealed",
  });
  const sealedDescriptor = openSync(
    receiptPath,
    constants.O_TRUNC | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    writeFileSync(sealedDescriptor, `${JSON.stringify(receipt)}\n`, "utf8");
    fsyncSync(sealedDescriptor);
  } finally {
    closeSync(sealedDescriptor);
  }
  return validateProcessGroupReceipt(runtime, receiptPath);
}

export function launchEnvIProcessGroup({
  args,
  cwd,
  environment,
  executable,
  label,
  stdio = "inherit",
}) {
  const canonicalExecutable = validateExecutable(executable, label);
  const exact = exactEnvironment(label, environment);
  const lease = leaseForEnvironment(exact);
  const assignments = Object.entries(exact)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`);
  const child = spawn(
    "/usr/bin/env",
    ["-i", ...assignments, canonicalExecutable, ...args],
    {
      cwd,
      detached: process.platform !== "win32",
      env: exact,
      stdio: stdioWithLease(stdio, lease.descriptor),
    },
  );
  if (!child.pid)
    throw new Error(`${label} did not expose a process-group ID.`);
  let receipt;
  try {
    receipt = recordOwnedDetachedProcessGroup({
      pid: child.pid,
      runToken: lease.runToken,
      runtime: {
        baseUrl: exact.CX_E2E_BASE_URL,
        markerPath: exact.CX_E2E_OWNER_MARKER,
        ownerNonce: exact.CX_E2E_OWNER_NONCE,
        ownerPid: Number(exact.CX_E2E_OWNER_PID),
        port: Number(exact.CX_E2E_PORT),
        productId: exact.CX_E2E_PRODUCT_ID,
        proxyUrl: exact.CX_E2E_PROXY_URL,
        root: exact.CX_E2E_TEMP_ROOT,
        runtimeTemp: exact.TMPDIR,
        tempParent: exact.CX_E2E_TEMP_PARENT,
      },
    });
  } catch (error) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch (killError) {
      if (killError?.code !== "ESRCH") {
        throw new AggregateError(
          [error, killError],
          `${label} could not establish or terminate its ownership proof.`,
        );
      }
    }
    throw error;
  }
  const result = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
  const group = Object.freeze({ child, label, pid: child.pid, result });
  PROCESS_GROUP_LEASES.set(group, lease);
  PROCESS_GROUP_RECEIPTS.set(group, receipt);
  return group;
}

function leaseForEnvironment(environment) {
  const runtimeRoot = environment.CX_E2E_TEMP_ROOT;
  if (runtimeRoot === undefined)
    throw new Error("Contained E2E processes require an owned runtime lease.");
  if (environment.CX_E2E_OWNER_PID !== String(process.pid)) {
    throw new Error(
      "Only the E2E wrapper owner can launch a top-level contained process.",
    );
  }
  return ownedLeaseForRoot(runtimeRoot);
}

function stdioWithLease(stdio, descriptor) {
  const normalized = Array.isArray(stdio) ? [...stdio] : [stdio, stdio, stdio];
  while (normalized.length <= E2E_LEASE_DESCRIPTOR) normalized.push("ignore");
  normalized[E2E_LEASE_DESCRIPTOR] = descriptor;
  return normalized;
}

export async function terminateProcessGroup(
  group,
  {
    gracefulSignal = "SIGTERM",
    gracefulTimeoutMs = 1_000,
    killTimeoutMs = 3_000,
  } = {},
) {
  if (process.platform === "win32") {
    if (group.child.exitCode === null && group.child.signalCode === null) {
      group.child.kill(gracefulSignal);
    }
    await Promise.race([group.result, delay(gracefulTimeoutMs)]);
    if (group.child.exitCode === null && group.child.signalCode === null) {
      group.child.kill("SIGKILL");
    }
    await group.result;
    return;
  }
  const lease = PROCESS_GROUP_LEASES.get(group);
  const receipt = PROCESS_GROUP_RECEIPTS.get(group);
  if (!lease || !receipt) {
    throw new Error(`${group.label} has no authenticated E2E runtime lease.`);
  }
  const signal = (selectedSignal) =>
    signalAuthenticatedProcessGroup(group.pid, selectedSignal, lease, receipt);
  const wait = (timeoutMs) =>
    waitForAuthenticatedProcessGroupExit(group.pid, timeoutMs, lease, receipt);
  signal(gracefulSignal);
  if (!(await wait(gracefulTimeoutMs))) {
    signal("SIGKILL");
    if (!(await wait(killTimeoutMs))) {
      throw new Error(
        `${group.label} process group ${group.pid} survived SIGKILL.`,
      );
    }
  }
  await group.result;
}

export async function terminateOwnedRunProcessGroups(runtime) {
  validateRuntime(runtime, false);
  const lease = ownedLeaseForRoot(runtime.root);
  for (let pass = 0; pass < 64; pass += 1) {
    const processGroups = inspectOwnedProcessGroups(runtime, lease);
    if (processGroups.length === 0) return;
    for (const { pgid, receipt } of processGroups.reverse()) {
      signalAuthenticatedProcessGroup(pgid, "SIGTERM", lease, receipt);
      if (
        !(await waitForAuthenticatedProcessGroupExit(
          pgid,
          1_000,
          lease,
          receipt,
        ))
      ) {
        signalAuthenticatedProcessGroup(pgid, "SIGKILL", lease, receipt);
        if (
          !(await waitForAuthenticatedProcessGroupExit(
            pgid,
            3_000,
            lease,
            receipt,
          ))
        ) {
          throw new Error(`Owned E2E process group ${pgid} survived SIGKILL.`);
        }
      }
    }
  }
  throw new Error("Owned E2E process-group census did not quiesce.");
}

function inspectOwnedProcessGroups(runtime, lease) {
  const receipts = readProcessGroupReceipts(runtime);
  const holders = inspectLeaseHolders(lease);
  const processes = new Map(
    inspectProcessTable().map((processInfo) => [processInfo.pid, processInfo]),
  );
  const processGroups = new Set();
  for (const pid of holders) {
    if (pid === process.pid) continue;
    const processInfo = processes.get(pid);
    if (
      processInfo &&
      processInfo.uid === currentUid() &&
      !processInfo.zombie
    ) {
      processGroups.add(processInfo.pgid);
    }
  }
  for (const pgid of receipts.keys()) {
    if (inspectProcessGroupMembers(pgid).length > 0) processGroups.add(pgid);
  }
  return [...processGroups]
    .sort((left, right) => left - right)
    .map((pgid) => {
      const receipt = receipts.get(pgid);
      return { pgid, receipt };
    });
}

function authenticatedProcessGroupExists(pgid, lease, receipt) {
  if (receipt) validateProcessGroupReceiptIdentity(receipt, pgid);
  const holders = inspectLeaseHolders(lease);
  const members = inspectProcessGroupMembers(pgid);
  if (members.length === 0) return false;
  const leader = receipt ? inspectExactProcessIdentity(receipt.pid) : undefined;
  const leaderMatches = receipt
    ? processIdentityMatchesReceipt(leader, receipt)
    : false;
  const allMembersAuthenticated = members.every(
    (pid) => holders.has(pid) || processHasRunToken(pid, lease.runToken),
  );
  if (
    !allMembersAuthenticated ||
    (receipt?.state === "sealed" &&
      members.includes(receipt.pid) &&
      !leaderMatches)
  ) {
    throw new Error(
      `E2E process group ${pgid} contains a process without its runtime lease or run token.`,
    );
  }
  const finalMembers = inspectProcessGroupMembers(pgid);
  const finalHolders = inspectLeaseHolders(lease);
  const finalLeader = receipt
    ? inspectExactProcessIdentity(receipt.pid)
    : undefined;
  if (finalMembers.length === 0) return false;
  if (
    finalMembers.length !== members.length ||
    finalMembers.some((pid, index) => pid !== members[index]) ||
    finalMembers.some(
      (pid) =>
        !finalHolders.has(pid) && !processHasRunToken(pid, lease.runToken),
    ) ||
    (receipt?.state === "sealed" &&
      finalMembers.includes(receipt.pid) &&
      !processIdentityMatchesReceipt(finalLeader, receipt))
  ) {
    throw new Error(
      `E2E process group ${pgid} changed during its ownership proof.`,
    );
  }
  return true;
}

function signalAuthenticatedProcessGroup(pgid, signal, lease, receipt) {
  if (!authenticatedProcessGroupExists(pgid, lease, receipt)) return;
  try {
    process.kill(-pgid, signal);
  } catch (error) {
    if (!new Set(["EPERM", "ESRCH"]).has(error?.code)) throw error;
  }
}

async function waitForAuthenticatedProcessGroupExit(
  pgid,
  timeoutMs,
  lease,
  receipt,
) {
  const deadline = Date.now() + timeoutMs;
  while (authenticatedProcessGroupExists(pgid, lease, receipt)) {
    if (Date.now() >= deadline) return false;
    await delay(20);
  }
  return true;
}

function inspectProcessGroupMembers(pgid) {
  const members = inspectProcessTable().filter(
    (processInfo) => processInfo.pgid === pgid && !processInfo.zombie,
  );
  if (members.some((processInfo) => processInfo.uid !== currentUid())) {
    throw new Error(
      `E2E process group ${pgid} contains a foreign user process.`,
    );
  }
  return members.map((processInfo) => processInfo.pid);
}

function inspectProcessTable() {
  const result = spawnSync("/bin/ps", ["-axo", "pid=,pgid=,uid=,stat="], {
    encoding: "utf8",
    env: Object.freeze({ LC_ALL: "C" }),
    maxBuffer: 1_048_576,
    timeout: 1_000,
  });
  if (result.error || result.status !== 0 || result.signal) {
    throw new Error("Could not inspect the E2E process table.", {
      cause: result.error,
    });
  }
  const processes = [];
  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s*$/u);
    if (!match) continue;
    processes.push({
      pgid: Number(match[2]),
      pid: Number(match[1]),
      uid: Number(match[3]),
      zombie: match[4].startsWith("Z"),
    });
  }
  return processes.sort((left, right) => left.pid - right.pid);
}

function inspectLeaseHolders(lease) {
  validateOwnedLeaseRecord(lease);
  if (process.platform === "linux") {
    return inspectLinuxLeaseHolders(lease);
  }
  if (process.platform !== "darwin") {
    throw new Error(
      `E2E runtime lease inspection is unsupported on ${process.platform}.`,
    );
  }
  const result = spawnSync("/usr/sbin/lsof", ["-Fn", "--", lease.path], {
    encoding: "utf8",
    env: Object.freeze({ LC_ALL: "C", PATH: "/usr/bin:/bin" }),
    maxBuffer: 1_048_576,
    timeout: 1_000,
  });
  if (result.error) {
    throw new Error("Could not inspect E2E runtime lease holders.", {
      cause: result.error,
    });
  }
  if (result.status !== 0 || result.signal) {
    throw new Error("Could not inspect E2E runtime lease holders.");
  }
  const holders = new Set();
  for (const line of result.stdout.split("\n")) {
    const match = line.match(/^p([1-9]\d*)$/u);
    if (match) holders.add(Number(match[1]));
  }
  if (!holders.has(process.pid)) {
    throw new Error("E2E runtime lease census lost its wrapper anchor.");
  }
  return holders;
}

function inspectLinuxLeaseHolders(lease) {
  const holders = new Set([process.pid]);
  let entries;
  try {
    entries = readdirSync("/proc", { withFileTypes: true });
  } catch (error) {
    throw new Error("Could not inspect Linux E2E runtime lease holders.", {
      cause: error,
    });
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[1-9]\d*$/u.test(entry.name)) continue;
    const pid = Number(entry.name);
    if (pid === process.pid) continue;
    const descriptorPath = `/proc/${pid}/fd/${E2E_LEASE_DESCRIPTOR}`;
    try {
      const metadata = statSync(descriptorPath);
      if (metadata.dev === lease.dev && metadata.ino === lease.ino) {
        holders.add(pid);
      }
    } catch (error) {
      if (!["EACCES", "ENOENT", "ENOTDIR", "ESRCH"].includes(error?.code)) {
        throw new Error(
          `Could not inspect E2E lease descriptor for process ${pid}.`,
          { cause: error },
        );
      }
    }
  }
  validateOwnedLeaseRecord(lease);
  return holders;
}

function readProcessGroupReceipts(runtime) {
  const directoryPath = validateProcessGroupDirectory(runtime);
  const entries = readdirSync(directoryPath, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  if (entries.length > 4_096) {
    throw new Error("E2E process-group receipt count exceeded its bound.");
  }
  const receipts = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !/^([1-9]\d*)\.json$/u.test(entry.name)) {
      throw new Error(
        `E2E process-group receipt directory contains ${entry.name}.`,
      );
    }
    const receiptPath = path.join(directoryPath, entry.name);
    const receipt = validateProcessGroupReceipt(runtime, receiptPath);
    if (entry.name !== `${receipt.pid}.json` || receipts.has(receipt.pgid)) {
      throw new Error("E2E process-group receipt identity is ambiguous.");
    }
    receipts.set(receipt.pgid, receipt);
  }
  return receipts;
}

function validateProcessGroupReceipt(runtime, receiptPath) {
  const directoryPath = validateProcessGroupDirectory(runtime);
  if (path.dirname(receiptPath) !== directoryPath) {
    throw new Error("E2E process-group receipt escaped its runtime root.");
  }
  const metadata = lstatSync(receiptPath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.uid !== currentUid() ||
    (metadata.mode & 0o777) !== 0o600 ||
    metadata.nlink !== 1 ||
    metadata.size < 2 ||
    metadata.size > 4_096
  ) {
    throw new Error("E2E process-group receipt is not one private file.");
  }
  const receipt = readJson(receiptPath, "E2E process-group receipt");
  if (
    !exactKeys(receipt, PROCESS_GROUP_RECEIPT_KEYS) ||
    receipt.schemaVersion !== MARKER_SCHEMA_VERSION ||
    receipt.ownerPid !== runtime.ownerPid ||
    receipt.ownerNonce !== runtime.ownerNonce ||
    receipt.root !== runtime.root ||
    receipt.pid !== receipt.pgid ||
    !Number.isSafeInteger(receipt.pid) ||
    receipt.pid <= 1 ||
    !new Set(["pending", "sealed"]).has(receipt.state) ||
    typeof receipt.startedAt !== "string" ||
    typeof receipt.commandName !== "string" ||
    (receipt.state === "pending" &&
      (receipt.startedAt !== "" || receipt.commandName !== "")) ||
    (receipt.state === "sealed" &&
      (!/^\S+\s+\S+\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4}$/u.test(
        receipt.startedAt,
      ) ||
        receipt.commandName.length === 0 ||
        receipt.commandName.length > 1_024 ||
        /[\0\r\n]/u.test(receipt.commandName)))
  ) {
    throw new Error("E2E process-group receipt no longer matches its owner.");
  }
  return Object.freeze(receipt);
}

function validateProcessGroupReceiptIdentity(receipt, pgid) {
  if (
    !receipt ||
    receipt.pgid !== pgid ||
    receipt.pid !== pgid ||
    receipt.ownerPid !== process.pid
  ) {
    throw new Error(
      `E2E process group ${pgid} has an invalid ownership receipt.`,
    );
  }
}

function inspectExactProcessIdentity(pid) {
  const result = spawnSync(
    "/bin/ps",
    ["-p", String(pid), "-o", "pid=,pgid=,uid=,lstart=,comm="],
    {
      encoding: "utf8",
      env: Object.freeze({ LC_ALL: "C" }),
      maxBuffer: 16_384,
      timeout: 1_000,
    },
  );
  if (result.status === 1 && result.stdout.trim() === "") return undefined;
  if (result.error || result.status !== 0 || result.signal) {
    throw new Error(`Could not inspect E2E process ${pid}.`, {
      cause: result.error,
    });
  }
  const match = result.stdout.match(
    /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+?)\s*$/u,
  );
  if (!match || Number(match[1]) !== pid) {
    throw new Error(`Could not parse E2E process identity for ${pid}.`);
  }
  return Object.freeze({
    commandName: match[5],
    pgid: Number(match[2]),
    pid: Number(match[1]),
    startedAt: match[4],
    uid: Number(match[3]),
  });
}

function processIdentityMatchesReceipt(identity, receipt) {
  return Boolean(
    identity &&
    receipt.state === "sealed" &&
    identity.pid === receipt.pid &&
    identity.pgid === receipt.pgid &&
    identity.uid === currentUid() &&
    identity.startedAt === receipt.startedAt &&
    identity.commandName === receipt.commandName,
  );
}

function processHasRunToken(pid, runToken) {
  const result = spawnSync(
    "/bin/ps",
    ["eww", "-p", String(pid), "-o", "command="],
    {
      encoding: "utf8",
      env: Object.freeze({ LC_ALL: "C" }),
      maxBuffer: 1_048_576,
      timeout: 1_000,
    },
  );
  if (result.status === 1 && result.stdout.trim() === "") return false;
  if (result.error || result.status !== 0 || result.signal) {
    throw new Error(`Could not authenticate E2E process ${pid}.`, {
      cause: result.error,
    });
  }
  return new RegExp(`(?:^|\\s)CX_E2E_RUN_TOKEN=${runToken}(?:\\s|$)`, "u").test(
    result.stdout,
  );
}

export function validateExecutable(value, label) {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const canonical = realpathSync(value);
  const metadata = lstatSync(canonical);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    ![0, currentUid()].includes(metadata.uid) ||
    (metadata.mode & 0o022) !== 0
  ) {
    throw new Error(`${label} is not one trusted executable file.`);
  }
  return canonical;
}

export function exactEnvironment(label, environment) {
  if (
    !environment ||
    typeof environment !== "object" ||
    Array.isArray(environment)
  ) {
    throw new Error(`${label} environment must be one explicit object.`);
  }
  const copy = {};
  for (const [key, value] of Object.entries(environment)) {
    const frameworkOwnedPnpmPolicy =
      key === PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY &&
      value === PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE;
    if (
      (!/^[A-Z][A-Z0-9_]*$/.test(key) && !frameworkOwnedPnpmPolicy) ||
      typeof value !== "string" ||
      value.includes("\0") ||
      (forbiddenEnvironmentKey(key) &&
        !(
          key === "NODE_OPTIONS" && value === TRUSTED_NETWORK_GUARD_NODE_OPTIONS
        ))
    ) {
      throw new Error(`${label} environment contains an invalid ${key} value.`);
    }
    copy[key] = value;
  }
  return Object.freeze(copy);
}

export function forbiddenEnvironmentKey(key) {
  return (
    FORBIDDEN_ENVIRONMENT_KEYS.has(key) ||
    (key.startsWith("NODE_") && key !== "NODE_ENV") ||
    FORBIDDEN_ENVIRONMENT_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}
