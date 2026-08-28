import childProcess from "node:child_process";
import dgram from "node:dgram";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import { fstatSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { ServerResponse } from "node:http";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";
import { fileURLToPath, pathToFileURL } from "node:url";
import workerThreads from "node:worker_threads";
import { E2E_OWNER_HEADER_NAME } from "./e2e-health-probe.mjs";
import {
  createExactOriginFetch,
  validateOwnedE2ERuntime,
} from "./e2e-runner.mjs";

// macOS injects this user-derived Core Foundation hint after exec even when the
// caller supplies an empty environment. It is not part of the E2E contract.
delete process.env.__CF_USER_TEXT_ENCODING;

const E2E_LEASE_NAME = ".cx-e2e-lease";
const E2E_LEASE_DESCRIPTOR = 17;
const E2E_RUNTIME_IDENTITY_KEYS = Object.freeze([
  "CX_E2E_BASE_URL",
  "CX_E2E_OWNER_MARKER",
  "CX_E2E_OWNER_NONCE",
  "CX_E2E_OWNER_PID",
  "CX_E2E_PORT",
  "CX_E2E_PRODUCT_ID",
  "CX_E2E_PROXY_URL",
  "CX_E2E_RUN_TOKEN",
  "CX_E2E_TEMP_PARENT",
  "CX_E2E_TEMP_ROOT",
]);
const guardModuleUrl = new URL(import.meta.url);
guardModuleUrl.search = "";
guardModuleUrl.hash = "";
const guardModulePath = realpathSync(fileURLToPath(guardModuleUrl));
const trustedNodeOptions = `--import=${pathToFileURL(guardModulePath).href}`;
if (process.env.NODE_OPTIONS !== trustedNodeOptions) {
  throw new Error(
    "E2E isolation requires its exact trusted Node network preload.",
  );
}
const guardStateMarker = Symbol.for("cx.e2e.network-guard-state");
const existingGuardState = globalThis[guardStateMarker];

const baseUrl = exactHttpLoopbackOrigin("CX_E2E_BASE_URL");
const proxyUrl = exactHttpLoopbackOrigin("CX_E2E_PROXY_URL");
const allowedSockets = new Set([
  socketIdentity(baseUrl),
  socketIdentity(proxyUrl),
]);
const nativeFetch = globalThis.fetch?.bind(globalThis);
const nativeDnsLookup = dns.lookup.bind(dns);
const nativeDnsPromisesLookup = dnsPromises.lookup.bind(dnsPromises);
const nativeNetConnect = net.connect.bind(net);
const nativeNetCreateConnection = net.createConnection.bind(net);
const nativeSocketConnect = net.Socket.prototype.connect;
const nativeTlsConnect = tls.connect.bind(tls);
const nativeServerListen = net.Server.prototype.listen;
const workerGuardMarker = Symbol.for("cx.e2e.hermetic-worker");
const targetServer = process.env.CX_E2E_TARGET_SERVER;
const runToken = requiredEnvironment("CX_E2E_RUN_TOKEN");
const runtime =
  existingGuardState?.runtime ??
  validateOwnedE2ERuntime({
    productId: requiredEnvironment("CX_E2E_PRODUCT_ID"),
  });
const leasePath = path.join(runtime.root, E2E_LEASE_NAME);
validateInheritedLease(leasePath);
if (!existingGuardState) {
  Object.defineProperty(globalThis, guardStateMarker, {
    configurable: false,
    enumerable: false,
    value: Object.freeze({
      runtime,
    }),
    writable: false,
  });
}

if (targetServer !== undefined && targetServer !== "1") {
  throw new Error("CX_E2E_TARGET_SERVER must be exactly 1 when present.");
}
if (targetServer === "1") {
  stampOwnedHealthResponses(runtime.ownerNonce);
}

if (nativeFetch) installFetchGuard(nativeFetch);
else process.nextTick(() => installFetchGuard(globalThis.fetch));

net.connect = (...args) => {
  return nativeNetConnect(...allowedSocketArguments("net.connect", args));
};
net.createConnection = (...args) => {
  return nativeNetCreateConnection(
    ...allowedSocketArguments("net.createConnection", args),
  );
};
net.Socket.prototype.connect = function (...args) {
  return nativeSocketConnect.apply(
    this,
    allowedSocketArguments("net.Socket.connect", args),
  );
};
tls.connect = (...args) => {
  return nativeTlsConnect(...allowedSocketArguments("tls.connect", args));
};
blockDatagramTransport();
blockDnsResolvers(dns, "dns", nativeDnsLookup);
blockDnsResolvers(dnsPromises, "dns.promises", nativeDnsPromisesLookup);
blockProcessInternalTransports();
containChildProcessSpawns();
containServerListeners();
retainGuardInWorkerThreads();
syncBuiltinESMExports();

function installFetchGuard(fetchImplementation) {
  if (typeof fetchImplementation !== "function") {
    throw new Error("E2E network isolation requires the Node fetch global.");
  }
  globalThis.fetch = createExactOriginFetch(
    fetchImplementation.bind(globalThis),
    baseUrl.origin,
  );
}

function stampOwnedHealthResponses(ownerNonce) {
  const nativeWriteHead = ServerResponse.prototype.writeHead;
  ServerResponse.prototype.writeHead = function (...args) {
    if (this.req?.url === "/healthz") {
      this.setHeader(E2E_OWNER_HEADER_NAME, ownerNonce);
      const headerIndex = typeof args[1] === "string" ? 2 : 1;
      const explicitHeaders = args[headerIndex];
      if (Array.isArray(explicitHeaders)) {
        const sealedHeaders = [];
        for (let index = 0; index < explicitHeaders.length; index += 2) {
          if (
            String(explicitHeaders[index]).toLowerCase() !==
            E2E_OWNER_HEADER_NAME
          ) {
            sealedHeaders.push(
              explicitHeaders[index],
              explicitHeaders[index + 1],
            );
          }
        }
        sealedHeaders.push(E2E_OWNER_HEADER_NAME, ownerNonce);
        args[headerIndex] = sealedHeaders;
      } else if (explicitHeaders && typeof explicitHeaders === "object") {
        const sealedHeaders = {};
        for (const [name, value] of Object.entries(explicitHeaders)) {
          if (name.toLowerCase() !== E2E_OWNER_HEADER_NAME) {
            sealedHeaders[name] = value;
          }
        }
        sealedHeaders[E2E_OWNER_HEADER_NAME] = ownerNonce;
        args[headerIndex] = sealedHeaders;
      }
    }
    return nativeWriteHead.apply(this, args);
  };
}

function containChildProcessSpawns() {
  const nativeSpawn = childProcess.ChildProcess.prototype.spawn;
  const nativeSpawnSync = childProcess.spawnSync;
  const nativeExecFileSync = childProcess.execFileSync;
  const nativeExecSync = childProcess.execSync;
  const spawnGuardMarker = Symbol.for("cx.e2e.hermetic-spawn");
  if (nativeSpawn?.[spawnGuardMarker] !== true) {
    const guardedSpawn = function (options) {
      const contained = {
        ...containedSpawnOptions(options),
        detached: false,
      };
      const result = nativeSpawn.call(this, contained);
      return result;
    };
    Object.defineProperty(guardedSpawn, spawnGuardMarker, { value: true });
    Object.defineProperty(childProcess.ChildProcess.prototype, "spawn", {
      configurable: false,
      enumerable: false,
      value: guardedSpawn,
      writable: false,
    });
  }

  installLockedChildProcessFunction(
    "spawnSync",
    function hermeticSpawnSync(file, args, options) {
      if (args && !Array.isArray(args)) {
        options = args;
        args = [];
      }
      return nativeSpawnSync.call(
        childProcess,
        file,
        args ?? [],
        containedPublicSpawnOptions(options),
      );
    },
    spawnGuardMarker,
  );
  installLockedChildProcessFunction(
    "execFileSync",
    function hermeticExecFileSync(file, args, options) {
      if (args && !Array.isArray(args)) {
        options = args;
        args = [];
      }
      return nativeExecFileSync.call(
        childProcess,
        file,
        args ?? [],
        containedPublicSpawnOptions(options),
      );
    },
    spawnGuardMarker,
  );
  installLockedChildProcessFunction(
    "execSync",
    function hermeticExecSync(command, options) {
      return nativeExecSync.call(
        childProcess,
        command,
        containedPublicSpawnOptions(options),
      );
    },
    spawnGuardMarker,
  );
}

function containServerListeners() {
  const listenGuardMarker = Symbol.for("cx.e2e.hermetic-listen");
  if (net.Server.prototype.listen?.[listenGuardMarker] === true) return;
  let listenerCreated = false;
  const guardedListen = function (...args) {
    if (targetServer !== "1") {
      throw blocked("net.Server.listen", "an unowned listener");
    }
    if (listenerCreated) {
      throw blocked("net.Server.listen", "a second target listener");
    }
    const contained = containedListenArguments(args);
    listenerCreated = true;
    return nativeServerListen.apply(this, contained);
  };
  Object.defineProperty(guardedListen, listenGuardMarker, { value: true });
  Object.defineProperty(net.Server.prototype, "listen", {
    configurable: false,
    enumerable: false,
    value: guardedListen,
    writable: false,
  });
}

function containedListenArguments(args) {
  const expectedPort = Number(runtime.port);
  const first = args[0];
  if (isOptions(first)) {
    if (first.port !== expectedPort && first.port !== String(expectedPort)) {
      throw blocked("net.Server.listen", String(first.port));
    }
    if (
      first.host !== "127.0.0.1" ||
      Object.hasOwn(first, "path") ||
      Object.hasOwn(first, "fd") ||
      Object.hasOwn(first, "handle") ||
      first.reusePort === true
    ) {
      throw blocked("net.Server.listen", "a non-owned endpoint");
    }
    return [
      {
        ...first,
        exclusive: true,
        host: "127.0.0.1",
        port: expectedPort,
      },
      ...args.slice(1),
    ];
  }
  const selectedPort = exactPort(first, "net.Server.listen");
  if (selectedPort !== expectedPort || args[1] !== "127.0.0.1") {
    throw blocked("net.Server.listen", `${String(args[1])}:${selectedPort}`);
  }
  return [expectedPort, "127.0.0.1", ...args.slice(2)];
}

function installLockedChildProcessFunction(name, implementation, marker) {
  if (childProcess[name]?.[marker] === true) return;
  Object.defineProperty(implementation, marker, { value: true });
  Object.defineProperty(childProcess, name, {
    configurable: false,
    enumerable: true,
    value: implementation,
    writable: false,
  });
}

function retainGuardInWorkerThreads() {
  const NativeWorker = workerThreads.Worker;
  if (NativeWorker?.[workerGuardMarker] === true) return;
  function HermeticE2EWorker(filename, options = {}) {
    if (!new.target) {
      throw new TypeError("worker_threads.Worker requires new.");
    }
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw blocked("worker_threads.Worker", "invalid worker options");
    }
    const guardedEnvironment = guardedWorkerEnvironment(options.env);
    const guardedExecArgv = guardedWorkerExecArgv(options.execArgv);
    const runtimeGuardUrl = `${import.meta.url.split("?")[0]}?worker-runtime=1`;
    if (options.eval === true) {
      const guardedSource = `import(${JSON.stringify(runtimeGuardUrl)}).then(() => {\n${filename}\n}).catch((error) => { throw error; });`;
      return new NativeWorker(guardedSource, {
        ...options,
        env: guardedEnvironment,
        execArgv: guardedExecArgv,
      });
    }
    const targetUrl = workerTargetUrl(filename);
    const bootstrapUrl = new URL(
      `data:text/javascript,${encodeURIComponent(
        `await import(${JSON.stringify(runtimeGuardUrl)}); await import(${JSON.stringify(targetUrl)});`,
      )}`,
    );
    return new NativeWorker(bootstrapUrl, {
      ...options,
      env: guardedEnvironment,
      execArgv: guardedExecArgv,
    });
  }
  Object.defineProperty(HermeticE2EWorker, "prototype", {
    value: NativeWorker.prototype,
  });
  Object.defineProperty(NativeWorker.prototype, "constructor", {
    configurable: false,
    enumerable: false,
    value: HermeticE2EWorker,
    writable: false,
  });
  Object.defineProperty(HermeticE2EWorker, workerGuardMarker, {
    value: true,
  });
  Object.defineProperty(workerThreads, "Worker", {
    configurable: false,
    enumerable: true,
    value: HermeticE2EWorker,
    writable: false,
  });
}

function guardedWorkerEnvironment(environment) {
  let angularAllowedHosts;
  let nodeCompileCache;
  if (environment !== undefined) {
    if (
      !environment ||
      typeof environment !== "object" ||
      Array.isArray(environment)
    ) {
      throw blocked("worker_threads.Worker", "environment override");
    }
    const descriptors = Object.getOwnPropertyDescriptors(environment);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (
        typeof key !== "string" ||
        descriptors[key].get ||
        descriptors[key].set
      ) {
        throw blocked("worker_threads.Worker", "environment override");
      }
    }
    for (const [name, value] of Object.entries(process.env)) {
      if (!Object.hasOwn(environment, name) || environment[name] !== value) {
        throw blocked("worker_threads.Worker", "environment override");
      }
    }
    for (const [name, value] of Object.entries(environment)) {
      if (Object.hasOwn(process.env, name)) {
        if (process.env[name] !== value) {
          throw blocked("worker_threads.Worker", "environment override");
        }
      } else if (name === "NG_ALLOWED_HOSTS" && value === "localhost") {
        angularAllowedHosts = value;
      } else if (
        name === "NODE_COMPILE_CACHE" &&
        isOwnedRuntimeDirectory(value)
      ) {
        nodeCompileCache = value;
      } else {
        throw blocked("worker_threads.Worker", "environment override");
      }
    }
  }
  return {
    ...process.env,
    ...(angularAllowedHosts ? { NG_ALLOWED_HOSTS: angularAllowedHosts } : {}),
    ...(nodeCompileCache ? { NODE_COMPILE_CACHE: nodeCompileCache } : {}),
    CX_E2E_RUN_TOKEN: runToken,
    NODE_OPTIONS: trustedNodeOptions,
  };
}

function isOwnedRuntimeDirectory(value) {
  try {
    if (typeof value !== "string" || !path.isAbsolute(value)) return false;
    const runtimeTemp = realpathSync(runtime.runtimeTemp);
    const candidate = realpathSync(value);
    const relative = path.relative(runtimeTemp, candidate);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      return false;
    }
    const metadata = lstatSync(candidate);
    const uid = process.getuid?.();
    return (
      metadata.isDirectory() &&
      !metadata.isSymbolicLink() &&
      (uid === undefined || metadata.uid === uid)
    );
  } catch {
    return false;
  }
}

function guardedWorkerExecArgv(execArgv) {
  if (execArgv === undefined) {
    return ["--import", guardModuleUrl.href];
  }
  if (!Array.isArray(execArgv)) {
    throw blocked("worker_threads.Worker", "preload override");
  }
  let sourceMaps = false;
  let angularImport = false;
  const allowed = [];
  for (const argument of execArgv) {
    if (argument === "--enable-source-maps" && !sourceMaps) {
      sourceMaps = true;
      allowed.push(argument);
      continue;
    }
    if (
      typeof argument === "string" &&
      argument.startsWith("--import=") &&
      !angularImport &&
      isTrustedAngularWorkerImport(argument.slice("--import=".length))
    ) {
      angularImport = true;
      allowed.push(argument);
      continue;
    }
    throw blocked("worker_threads.Worker", "preload override");
  }
  return ["--import", guardModuleUrl.href, ...allowed];
}

function isTrustedAngularWorkerImport(specifier) {
  try {
    const url = new URL(specifier);
    if (url.protocol !== "file:" || url.search || url.hash) return false;
    const file = realpathSync(fileURLToPath(url));
    const packageRoot = path.resolve(path.dirname(file), "../../../..");
    const relative = path.relative(packageRoot, file);
    if (
      relative !==
      path.join(
        "src",
        "utils",
        "server-rendering",
        "esm-in-memory-loader",
        "register-hooks.js",
      )
    ) {
      return false;
    }
    const metadata = lstatSync(file);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return false;
    const manifest = JSON.parse(
      readFileSync(path.join(packageRoot, "package.json"), "utf8"),
    );
    return manifest?.name === "@angular/build";
  } catch {
    return false;
  }
}

function workerTargetUrl(filename) {
  if (filename instanceof URL) return filename.href;
  if (typeof filename !== "string" || filename.length === 0) {
    throw new TypeError("worker_threads.Worker requires a filename.");
  }
  if (filename.startsWith("data:")) return new URL(filename).href;
  return pathToFileURL(path.resolve(filename)).href;
}

function containedSpawnOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("E2E isolation received invalid child spawn options.");
  }
  if (!Array.isArray(options.envPairs)) {
    throw new Error("E2E isolation requires one explicit child environment.");
  }
  const environment = new Map();
  for (const pair of options.envPairs) {
    const separator = typeof pair === "string" ? pair.indexOf("=") : -1;
    if (separator < 1) {
      throw new Error("E2E isolation received an invalid child environment.");
    }
    environment.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  for (const name of E2E_RUNTIME_IDENTITY_KEYS) {
    environment.set(name, requiredEnvironment(name));
  }
  environment.set("NODE_OPTIONS", trustedNodeOptions);
  return {
    ...options,
    envPairs: [...environment]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${name}=${value}`),
    stdio: stdioWithLease(options.stdio),
  };
}

function containedPublicSpawnOptions(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("E2E isolation received invalid sync spawn options.");
  }
  const environment = options.env ?? process.env;
  if (!environment || typeof environment !== "object") {
    throw new Error(
      "E2E isolation requires one explicit sync child environment.",
    );
  }
  const guardedEnvironment = { ...environment };
  for (const name of E2E_RUNTIME_IDENTITY_KEYS) {
    guardedEnvironment[name] = requiredEnvironment(name);
  }
  guardedEnvironment.NODE_OPTIONS = trustedNodeOptions;
  return {
    ...options,
    env: guardedEnvironment,
    stdio: stdioWithLease(options.stdio),
  };
}

function stdioWithLease(stdio) {
  validateInheritedLease(leasePath);
  const normalized = Array.isArray(stdio)
    ? [...stdio]
    : stdio === undefined
      ? ["pipe", "pipe", "pipe"]
      : [stdio, stdio, stdio];
  while (normalized.length <= E2E_LEASE_DESCRIPTOR) normalized.push("ignore");
  normalized[E2E_LEASE_DESCRIPTOR] = E2E_LEASE_DESCRIPTOR;
  return normalized;
}

function blockDatagramTransport() {
  dgram.createSocket = () => {
    throw blocked("dgram.createSocket", "UDP");
  };
  for (const method of ["bind", "connect", "send"]) {
    dgram.Socket.prototype[method] = () => {
      throw blocked(`dgram.Socket.${method}`, "UDP");
    };
  }
}

function blockDnsResolvers(module, label, nativeLookup) {
  for (const name of Object.keys(module)) {
    if (name === "lookup") {
      module[name] = (hostname, ...args) => {
        if (hostname !== "127.0.0.1") {
          throw blocked(`${label}.${name}`, "network name resolution");
        }
        return nativeLookup(hostname, ...args);
      };
    } else if (
      name === "lookupService" ||
      name === "reverse" ||
      name.startsWith("resolve")
    ) {
      module[name] = () => {
        throw blocked(`${label}.${name}`, "network name resolution");
      };
    }
  }
  const resolver = module.Resolver?.prototype;
  if (!resolver) return;
  for (const name of Object.getOwnPropertyNames(resolver)) {
    if (name === "reverse" || name.startsWith("resolve")) {
      resolver[name] = () => {
        throw blocked(`${label}.Resolver.${name}`, "network name resolution");
      };
    }
  }
}

function blockProcessInternalTransports() {
  const bindingGuardMarker = Symbol.for("cx.e2e.hermetic-binding");
  for (const name of ["binding", "_linkedBinding"]) {
    const native = process[name];
    if (typeof native !== "function") continue;
    if (native[bindingGuardMarker] === true) continue;
    const guarded = function (bindingName, ...args) {
      if (
        typeof bindingName === "string" &&
        /(?:cares|pipe|stream|tcp|tls|udp)/iu.test(bindingName)
      ) {
        throw blocked(`process.${name}`, bindingName);
      }
      return native.call(process, bindingName, ...args);
    };
    Object.defineProperty(guarded, bindingGuardMarker, { value: true });
    Object.defineProperty(process, name, {
      configurable: false,
      enumerable: false,
      value: guarded,
      writable: false,
    });
  }
}

function exactHttpLoopbackOrigin(name) {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is required by the E2E network guard.`);
  const url = new URL(raw);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== raw
  ) {
    throw new Error(`${name} must be one exact loopback HTTP origin.`);
  }
  return url;
}

function socketIdentity(url) {
  return `127.0.0.1:${url.port}`;
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required by the E2E network guard.`);
  }
  return value;
}

function validateInheritedLease(expectedPath) {
  const pathMetadata = lstatSync(expectedPath);
  const uid = process.getuid?.();
  let descriptorMetadata;
  try {
    descriptorMetadata = fstatSync(E2E_LEASE_DESCRIPTOR);
  } catch (error) {
    throw new Error("E2E process did not inherit its runtime lease.", {
      cause: error,
    });
  }
  if (
    !pathMetadata.isFile() ||
    pathMetadata.isSymbolicLink() ||
    (uid !== undefined && pathMetadata.uid !== uid) ||
    (pathMetadata.mode & 0o777) !== 0o600 ||
    pathMetadata.nlink !== 1 ||
    pathMetadata.size !== 0 ||
    pathMetadata.dev !== descriptorMetadata.dev ||
    pathMetadata.ino !== descriptorMetadata.ino
  ) {
    throw new Error(
      "E2E inherited runtime lease no longer matches its owned file.",
    );
  }
  return descriptorMetadata;
}

function allowedSocketArguments(transport, args, depth = 0) {
  const first = args[0];
  if (Array.isArray(first)) {
    if (depth >= 2) throw blocked(transport, "nested connection arguments");
    return allowedSocketArguments(transport, first, depth + 1);
  }
  if (typeof first === "string") throw blocked(transport, first);
  if (typeof first === "number") {
    const port = exactPort(first, transport);
    const explicitHost = typeof args[1] === "string" ? args[1] : undefined;
    const optionsIndex = args.findIndex(
      (candidate, index) => index > 0 && isOptions(candidate),
    );
    const options = optionsIndex === -1 ? undefined : args[optionsIndex];
    const host = explicitHost ?? options?.host;
    assertExactSocket(transport, host, port);
    const safeOptions = options
      ? sanitizeSocketOptions(transport, options, host, port)
      : undefined;
    if (explicitHost) {
      const safe = [...args];
      if (safeOptions) safe[optionsIndex] = safeOptions;
      return safe;
    }
    if (!safeOptions) throw blocked(transport, `${String(host)}:${port}`);
    return [port, host, safeOptions, ...args.slice(optionsIndex + 1)];
  }
  if (isOptions(first)) {
    const port = exactPort(first.port, transport);
    const host = first.host;
    assertExactSocket(transport, host, port);
    return [
      sanitizeSocketOptions(transport, first, host, port),
      ...args.slice(1),
    ];
  }
  throw blocked(transport, "invalid connection arguments");
}

function sanitizeSocketOptions(transport, options, host, port) {
  // Node's HTTP Agent carries `path: null` into net.createConnection so net
  // selects TCP rather than a pipe. Every other own path value remains a
  // caller-selected Unix socket and must fail closed.
  const hasSocketPath = Object.hasOwn(options, "path") && options.path !== null;
  if (
    hasSocketPath ||
    Object.hasOwn(options, "socket") ||
    Object.hasOwn(options, "lookup") ||
    Object.hasOwn(options, "createConnection") ||
    (options.hostname !== undefined && options.hostname !== host) ||
    (options.host !== undefined && options.host !== host)
  ) {
    throw blocked(transport, "conflicting connection options");
  }
  const safe = { ...options, host, hostname: host, port };
  delete safe.path;
  delete safe.socket;
  delete safe.lookup;
  delete safe.createConnection;
  return safe;
}

function assertExactSocket(transport, host, port) {
  if (typeof host !== "string") {
    throw blocked(transport, `${String(host)}:${port}`);
  }
  const identity = `${host}:${port}`;
  if (!allowedSockets.has(identity)) throw blocked(transport, identity);
}

function exactPort(value, transport) {
  const port =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^[1-9]\d*$/.test(value)
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw blocked(transport, `invalid port ${String(value)}`);
  }
  return port;
}

function isOptions(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function blocked(transport, target) {
  return new Error(`E2E network isolation blocked ${transport} to ${target}.`);
}
