import {
  chmodSync,
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { userInfo } from "node:os";
import path from "node:path";
import { pathToFileURL, URL as NodeURL } from "node:url";
import { E2E_DYNAMIC_PORT_RANGE } from "./e2e-contract.mjs";
import {
  createExactOriginFetch,
  createExactOriginProxy,
  exactLoopbackOrigin,
  formatResult,
  loopbackPortIsOpen,
  reserveLoopbackPort,
  validatePort,
  validatedStartupTimeout,
  waitForExactLoopbackHealth,
  waitForLoopbackPortToClose,
} from "./e2e-network-orchestration-internal.mjs";
import {
  NETWORK_GUARD_PATH,
  PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY,
  PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE,
  TRUSTED_NETWORK_GUARD_NODE_OPTIONS,
  exactEnvironment,
  forbiddenEnvironmentKey,
  launchEnvIProcessGroup,
  recordOwnedDetachedProcessGroup,
  terminateOwnedRunProcessGroups,
  terminateProcessGroup,
  validateExecutable,
} from "./e2e-process-ownership-internal.mjs";
import {
  E2E_OWNER_MARKER_NAME,
  assertProductId,
  createOwnedE2ERuntime,
  ownedLeaseForRoot,
  readJson,
  releaseOwnedLease,
  removeOwnedE2ERuntime,
  requiredEnvironment,
  sealOwnedE2EProxy,
  validateOwnedE2ERuntime,
  withOwnedE2ERuntime,
} from "./e2e-runtime-ownership-internal.mjs";
import {
  canonicalContainedFile,
  validateHermeticPlaywrightSourcePolicy,
} from "./e2e-source-policy-internal.mjs";

export { E2E_DYNAMIC_PORT_RANGE } from "./e2e-contract.mjs";
export { createExactOriginFetch, createExactOriginProxy };
export {
  E2E_OWNER_MARKER_NAME,
  createOwnedE2ERuntime,
  launchEnvIProcessGroup,
  recordOwnedDetachedProcessGroup,
  removeOwnedE2ERuntime,
  terminateProcessGroup,
  validateOwnedE2ERuntime,
  withOwnedE2ERuntime,
};
export { validateHermeticPlaywrightSourcePolicy };
export const E2E_STANDARD_ENVIRONMENT_KEYS = Object.freeze(
  [
    "CI",
    "CX_E2E_BASE_URL",
    "CX_E2E_OWNER_MARKER",
    "CX_E2E_OWNER_NONCE",
    "CX_E2E_OWNER_PID",
    "CX_E2E_PNPM_CLI_PATH",
    "CX_E2E_PORT",
    "CX_E2E_PRODUCT_ID",
    "CX_E2E_PROXY_URL",
    "CX_E2E_RUN_TOKEN",
    "CX_E2E_TEMP_PARENT",
    "CX_E2E_TEMP_ROOT",
    "NODE_OPTIONS",
    "PATH",
    PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY,
    "TMPDIR",
  ].sort(),
);
export const E2E_CHROMIUM_NETWORK_ARGUMENTS = Object.freeze([
  "--disable-quic",
  "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
]);

const CHILD_RUNTIME_IDENTITY_KEYS = Object.freeze([
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
const NPM_CONFIG_FENCE_KEYS = Object.freeze(
  new Set(["NPM_CONFIG_GLOBALCONFIG", "NPM_CONFIG_USERCONFIG"]),
);

const FORBIDDEN_PLAYWRIGHT_ARGUMENTS = Object.freeze([
  "--browser",
  "--config",
  "--debug",
  "--fully-parallel",
  "--output",
  "--repeat-each",
  "--reporter",
  "--retries",
  "--run-agents",
  "--test-list",
  "--test-list-invert",
  "--tsconfig",
  "--ui",
  "--ui-host",
  "--ui-port",
  "--update-snapshots",
  "--update-source-method",
  "--workers",
]);
const PLAYWRIGHT_NETWORK_OPTION_KEYS = Object.freeze(
  new Set([
    "baseURL",
    "browserName",
    "connectOptions",
    "contextOptions",
    "launchOptions",
    "proxy",
    "serviceWorkers",
  ]),
);
export async function runHermeticE2E(options) {
  assertPlainObject(options, "Hermetic E2E runner options");
  const supportedOptions = new Set([
    "configure",
    "playwrightArgs",
    "productId",
    "repoRoot",
  ]);
  const unsupported = Object.keys(options).filter(
    (key) => !supportedOptions.has(key),
  );
  if (unsupported.length > 0) {
    throw new Error(
      `Hermetic E2E runner does not support ${unsupported.sort().join(", ")}.`,
    );
  }
  const {
    configure,
    playwrightArgs = process.argv.slice(2),
    productId,
    repoRoot,
  } = options;
  let requestedSignal;
  let requestStop = () => Promise.resolve();
  let primaryError;
  const signalHandlers = new Map();
  for (const signal of ["SIGHUP", "SIGINT", "SIGQUIT", "SIGTERM"]) {
    const handler = () => {
      if (requestedSignal) return;
      requestedSignal = signal;
      void requestStop().catch((error) => {
        primaryError ??= error;
      });
    };
    signalHandlers.set(signal, handler);
    process.on(signal, handler);
  }

  let runtime;
  let groupsProvenDead = false;
  let runResult;
  try {
    assertProductId(productId);
    const canonicalRoot = realpathSync(path.resolve(repoRoot));
    const args = validatePlaywrightArguments(playwrightArgs);
    const executables = resolveE2EExecutables(canonicalRoot);
    const assertNotSignaled = () => {
      if (requestedSignal) {
        throw new Error(
          `${productId} E2E stopped before launch (${requestedSignal}).`,
        );
      }
    };
    assertNotSignaled();
    const port = await reserveLoopbackPort();
    assertNotSignaled();
    validatePort(port);
    if (await loopbackPortIsOpen(port)) {
      throw new Error(
        `${productId} E2E refuses the occupied loopback port ${port}; reuse is forbidden.`,
      );
    }
    assertNotSignaled();
    runtime = createOwnedE2ERuntime({ port, productId });

    const groups = [];
    const groupStops = new Map();
    let proxy;
    let playwrightResult;

    const stopGroup = (group, signal = "SIGTERM") => {
      if (!group) return Promise.resolve();
      const existing = groupStops.get(group.pid);
      if (existing) return existing;
      const stopping = terminateProcessGroup(group, {
        gracefulSignal: signal,
        gracefulTimeoutMs: 1_000,
        killTimeoutMs: 3_000,
      });
      groupStops.set(group.pid, stopping);
      return stopping;
    };
    const stopAll = async (signal = "SIGTERM") => {
      const errors = [];
      for (const group of [...groups].reverse()) {
        try {
          await stopGroup(group, signal);
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, "E2E process-group teardown failed.");
      }
    };
    requestStop = () => stopAll("SIGTERM");

    try {
      assertNotSignaled();
      proxy = await createExactOriginProxy(runtime.baseUrl);
      const sealedRuntime = sealOwnedE2EProxy(runtime, proxy.url);
      const pathValue = createOwnedE2ECommandPath({
        nodeExecutable: executables.nodeExecutable,
        pnpmCliPath: executables.pnpmCliPath,
        runtime: sealedRuntime,
      });
      assertNotSignaled();
      const context = Object.freeze({
        baseUrl: sealedRuntime.baseUrl,
        networkGuardPath: NETWORK_GUARD_PATH,
        nodeExecutable: executables.nodeExecutable,
        pathValue,
        playwrightCliPath: executables.playwrightCliPath,
        pnpmCliPath: executables.pnpmCliPath,
        port,
        proxyUrl: proxy.url,
        repoRoot: canonicalRoot,
        runtime: sealedRuntime,
      });
      const configured = configure(context);
      if (configured && typeof configured.then === "function") {
        void Promise.resolve(configured).catch(() => {});
        throw new Error("E2E product configuration must be synchronous.");
      }
      assertNotSignaled();
      validateConfiguration(configured, canonicalRoot, context);
      const playwrightEnvironment = createPlaywrightEnvironment({
        ci: normalizedCi(process.env.CI),
        extras: configured.playwrightEnvironment ?? {},
        pathValue: context.pathValue,
        pnpmCliPath: context.pnpmCliPath,
        proxyUrl: context.proxyUrl,
        runtime,
      });
      const listOnly = args.includes("--list");
      let controller;
      if (!listOnly) {
        assertNotSignaled();
        controller = launchEnvIProcessGroup({
          args: [
            "--import",
            context.networkGuardPath,
            configured.controller.scriptPath,
          ],
          cwd: canonicalRoot,
          environment: configured.controller.environment,
          executable: context.nodeExecutable,
          label: `${productId} E2E controller`,
        });
        groups.push(controller);
        await waitForExactLoopbackHealth({
          controller,
          ownerNonce: sealedRuntime.ownerNonce,
          timeoutMs: validatedStartupTimeout(
            configured.controller.startupTimeoutMs,
          ),
          url: `${runtime.baseUrl}/healthz`,
        });
        assertNotSignaled();
      }

      assertNotSignaled();
      const playwright = launchEnvIProcessGroup({
        args: [
          "--import",
          context.networkGuardPath,
          context.playwrightCliPath,
          "test",
          "--config",
          configured.configPath,
          ...args,
        ],
        cwd: canonicalRoot,
        environment: playwrightEnvironment,
        executable: context.nodeExecutable,
        label: `${productId} Playwright`,
      });
      groups.push(playwright);

      if (controller) {
        const winner = await Promise.race([
          playwright.result.then((result) => ({ owner: "playwright", result })),
          controller.result.then((result) => ({ owner: "controller", result })),
        ]);
        if (winner.owner === "controller") {
          await stopGroup(playwright);
          throw new Error(
            `${productId} E2E controller exited before Playwright (${formatResult(winner.result)}).`,
          );
        }
        playwrightResult = winner.result;
      } else {
        playwrightResult = await playwright.result;
      }
    } catch (error) {
      primaryError = error;
    } finally {
      const teardownErrors = [];
      try {
        await stopAll("SIGTERM");
      } catch (error) {
        teardownErrors.push(error);
      }
      try {
        await terminateOwnedRunProcessGroups(runtime);
      } catch (error) {
        teardownErrors.push(error);
      }
      if (proxy) {
        try {
          await proxy.close();
        } catch (error) {
          teardownErrors.push(error);
        }
      }
      try {
        if (proxy) {
          await waitForLoopbackPortToClose(Number(new NodeURL(proxy.url).port));
        }
        await waitForLoopbackPortToClose(port);
      } catch (error) {
        teardownErrors.push(error);
      }
      if (teardownErrors.length === 0) {
        groupsProvenDead = true;
      } else {
        const teardownError = new AggregateError(
          teardownErrors,
          "E2E process, listener, or port cleanup proof failed.",
        );
        primaryError = primaryError
          ? new AggregateError(
              [primaryError, teardownError],
              "E2E run and teardown failed.",
            )
          : teardownError;
      }
    }

    if (primaryError) throw primaryError;
    if (
      requestedSignal ||
      !playwrightResult ||
      playwrightResult.code === null
    ) {
      throw new Error(
        `${productId} E2E stopped before completion${requestedSignal ? ` (${requestedSignal})` : ""}.`,
      );
    }
    runResult = playwrightResult.code;
  } catch (error) {
    primaryError =
      primaryError && primaryError !== error
        ? new AggregateError([primaryError, error], "E2E run failed.")
        : error;
  }

  try {
    if (runtime) {
      if (groupsProvenDead) {
        try {
          removeOwnedE2ERuntime(runtime);
        } catch (error) {
          primaryError = primaryError
            ? new AggregateError(
                [primaryError, error],
                `E2E finished but its proven-dead runtime root ${runtime.root} could not be removed.`,
              )
            : error;
        }
      } else {
        const preservation = new Error(
          `E2E process death was not proven; preserved owned runtime root ${runtime.root}.`,
        );
        primaryError = primaryError
          ? new AggregateError(
              [primaryError, preservation],
              `E2E teardown was unproven; preserved owned runtime root ${runtime.root}.`,
            )
          : preservation;
      }
      releaseOwnedLease(runtime);
    }
    if (requestedSignal && !primaryError) {
      primaryError = new Error(
        `${productId} E2E stopped before completion (${requestedSignal}).`,
      );
    }
  } finally {
    requestStop = () => Promise.resolve();
    for (const [signal, handler] of signalHandlers) {
      process.off(signal, handler);
    }
  }

  if (primaryError) throw primaryError;
  return runResult;
}

export function createPlaywrightEnvironment({
  ci,
  extras = {},
  pathValue,
  pnpmCliPath,
  proxyUrl,
  runtime,
}) {
  return createHermeticEnvironment({
    ci,
    extras,
    label: "Playwright",
    pathValue,
    pnpmCliPath,
    proxyUrl,
    runtime,
  });
}

export function createE2EControllerEnvironment({
  ci = "",
  extras = {},
  pathValue,
  pnpmCliPath,
  proxyUrl,
  runtime,
}) {
  return createHermeticEnvironment({
    ci,
    extras,
    label: "controller",
    pathValue,
    pnpmCliPath,
    proxyUrl,
    runtime,
  });
}

export function createHermeticE2EChildEnvironment(
  productEnvironment,
  options = {},
) {
  assertPlainObject(options, "Hermetic E2E child options");
  const unsupported = Object.keys(options).filter(
    (key) => key !== "targetServer",
  );
  if (
    unsupported.length > 0 ||
    (options.targetServer !== undefined &&
      typeof options.targetServer !== "boolean")
  ) {
    throw new Error(
      `Invalid hermetic E2E child options${unsupported.length > 0 ? `: ${unsupported.sort().join(", ")}` : "."}`,
    );
  }
  const productId = requiredEnvironment(process.env, "CX_E2E_PRODUCT_ID");
  const runtime = validateOwnedE2ERuntime({ productId });
  const child = explicitProductChildEnvironment(productEnvironment);
  if (
    child.PATH !== requiredEnvironment(process.env, "PATH") ||
    child.TMPDIR !== runtime.runtimeTemp
  ) {
    throw new Error(
      "Product-owned E2E child PATH and TMPDIR must match their controller-owned values.",
    );
  }
  if (
    options.targetServer &&
    (child.HOST !== "127.0.0.1" || child.PORT !== String(runtime.port))
  ) {
    throw new Error(
      "The hermetic E2E target server must bind its exact owned loopback origin.",
    );
  }
  const identity = {};
  for (const name of CHILD_RUNTIME_IDENTITY_KEYS) {
    identity[name] = requiredEnvironment(process.env, name);
  }
  return Object.freeze({
    ...child,
    ...identity,
    NODE_OPTIONS: TRUSTED_NETWORK_GUARD_NODE_OPTIONS,
    [PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY]:
      PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE,
    ...(options.targetServer ? { CX_E2E_TARGET_SERVER: "1" } : {}),
  });
}

export function createHermeticPlaywrightUse(runtime, options = {}) {
  if (!runtime || typeof runtime !== "object") {
    throw new Error("Hermetic Playwright use requires its validated runtime.");
  }
  const ownedRuntime = runtimeFromEnvironment();
  for (const name of [
    "baseUrl",
    "markerPath",
    "ownerNonce",
    "ownerPid",
    "port",
    "productId",
    "proxyUrl",
    "root",
    "runtimeTemp",
    "tempParent",
  ]) {
    if (runtime[name] !== ownedRuntime[name]) {
      throw new Error(
        "Hermetic Playwright use requires the exact environment-owned runtime.",
      );
    }
  }
  const base = exactLoopbackOrigin(ownedRuntime.baseUrl, "owned E2E origin");
  const proxy = exactLoopbackOrigin(ownedRuntime.proxyUrl, "owned E2E proxy");
  if (base.origin === proxy.origin) {
    throw new Error("The owned E2E proxy must not reuse the app origin.");
  }
  assertPlainObject(options, "Hermetic Playwright product options");
  for (const key of Object.keys(options)) {
    if (PLAYWRIGHT_NETWORK_OPTION_KEYS.has(key)) {
      throw new Error(
        `Hermetic Playwright product options cannot override ${key}.`,
      );
    }
  }
  return Object.freeze({
    ...options,
    baseURL: base.origin,
    browserName: "chromium",
    launchOptions: Object.freeze({
      args: E2E_CHROMIUM_NETWORK_ARGUMENTS,
      proxy: Object.freeze({ server: proxy.origin }),
    }),
    proxy: Object.freeze({ server: proxy.origin }),
    serviceWorkers: "block",
  });
}

export function createHermeticBrowserContext(browser, options = {}) {
  if (!browser || typeof browser.newContext !== "function") {
    throw new TypeError("A Playwright Browser is required.");
  }
  const runtime = runtimeFromEnvironment();
  const contextOptions = hermeticManualOptions(options, runtime, true);
  return browser.newContext(contextOptions);
}

export function createHermeticAPIRequestContext(request, options = {}) {
  if (!request || typeof request.newContext !== "function") {
    throw new TypeError("A Playwright APIRequest factory is required.");
  }
  const runtime = runtimeFromEnvironment();
  const contextOptions = hermeticManualOptions(options, runtime, false);
  return request.newContext(contextOptions);
}

function createHermeticEnvironment({
  ci,
  extras,
  label,
  pathValue,
  pnpmCliPath,
  proxyUrl,
  runtime,
}) {
  const lease = ownedLeaseForRoot(runtime.root);
  const reserved = new Set(E2E_STANDARD_ENVIRONMENT_KEYS);
  for (const [key, value] of Object.entries(extras)) {
    if (
      reserved.has(key) ||
      key.startsWith("CX_E2E_") ||
      !/^[A-Z][A-Z0-9_]*$/.test(key) ||
      typeof value !== "string" ||
      value.includes("\0")
    ) {
      throw new Error(`Invalid product-owned E2E environment entry: ${key}.`);
    }
  }
  return exactEnvironment(label, {
    CI: ci,
    CX_E2E_BASE_URL: runtime.baseUrl,
    CX_E2E_OWNER_MARKER: runtime.markerPath,
    CX_E2E_OWNER_NONCE: runtime.ownerNonce,
    CX_E2E_OWNER_PID: String(runtime.ownerPid),
    CX_E2E_PNPM_CLI_PATH: pnpmCliPath,
    CX_E2E_PORT: String(runtime.port),
    CX_E2E_PRODUCT_ID: runtime.productId,
    CX_E2E_PROXY_URL: proxyUrl,
    CX_E2E_RUN_TOKEN: lease.runToken,
    CX_E2E_TEMP_PARENT: runtime.tempParent,
    CX_E2E_TEMP_ROOT: runtime.root,
    NODE_OPTIONS: TRUSTED_NETWORK_GUARD_NODE_OPTIONS,
    PATH: pathValue,
    TMPDIR: runtime.runtimeTemp,
    ...extras,
    [PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY]:
      PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE,
  });
}

export function createE2EPath(nodeExecutable) {
  const canonicalNode = validateExecutable(nodeExecutable, "Node executable");
  return [...new Set([path.dirname(canonicalNode), "/usr/bin", "/bin"])].join(
    path.delimiter,
  );
}

function createOwnedE2ECommandPath({ nodeExecutable, pnpmCliPath, runtime }) {
  const canonicalNode = validateExecutable(nodeExecutable, "Node executable");
  const canonicalPnpm = validateExecutable(pnpmCliPath, "Corepack pnpm CLI");
  const commandDirectory = path.join(runtime.root, ".cx-e2e-tools");
  mkdirSync(commandDirectory, { mode: 0o700 });
  chmodSync(commandDirectory, 0o700);
  const launcherPath = path.join(commandDirectory, "pnpm");
  const launcherSource = `#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const result = spawnSync(process.execPath, [${JSON.stringify(canonicalPnpm)}, ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.signal) process.kill(process.pid, result.signal);
process.exit(result.status ?? 1);
`;
  const descriptor = openSync(
    launcherPath,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o500,
  );
  try {
    writeFileSync(descriptor, launcherSource, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  chmodSync(launcherPath, 0o500);
  const directory = lstatSync(commandDirectory);
  const launcher = lstatSync(launcherPath);
  if (
    !directory.isDirectory() ||
    directory.isSymbolicLink() ||
    directory.uid !== userInfo().uid ||
    (directory.mode & 0o777) !== 0o700 ||
    realpathSync(commandDirectory) !== commandDirectory ||
    !launcher.isFile() ||
    launcher.isSymbolicLink() ||
    launcher.uid !== userInfo().uid ||
    launcher.nlink !== 1 ||
    (launcher.mode & 0o777) !== 0o500 ||
    realpathSync(launcherPath) !== launcherPath
  ) {
    throw new Error("Owned E2E pnpm launcher is not one private executable.");
  }
  return [commandDirectory, createE2EPath(canonicalNode)].join(path.delimiter);
}

export function resolveE2EExecutables(repoRoot) {
  const canonicalRoot = realpathSync(path.resolve(repoRoot));
  const nodeExecutable = validateExecutable(
    process.execPath,
    "Node executable",
  );
  const packageJsonPath = path.join(canonicalRoot, "package.json");
  const packageJson = readJson(packageJsonPath, "product package.json");
  const packageManager = packageJson.packageManager;
  const managerMatch =
    typeof packageManager === "string"
      ? packageManager.match(/^pnpm@(\d+\.\d+\.\d+)\+sha512\.[0-9a-f]{128}$/)
      : null;
  if (!managerMatch) {
    throw new Error(
      "E2E requires the integrity-pinned pnpm packageManager locator.",
    );
  }
  const pnpmCliPath = validateExecutable(
    path.join(
      userInfo().homedir,
      ".cache",
      "node",
      "corepack",
      "v1",
      "pnpm",
      managerMatch[1],
      "bin",
      "pnpm.mjs",
    ),
    "Corepack pnpm CLI",
  );
  const localRequire = createRequire(pathToFileURL(packageJsonPath));
  const directPlaywrightPackage = realpathSync(
    path.join(
      canonicalRoot,
      "node_modules",
      "@playwright",
      "test",
      "package.json",
    ),
  );
  const resolvedPlaywrightPackage = realpathSync(
    localRequire.resolve("@playwright/test/package.json"),
  );
  if (resolvedPlaywrightPackage !== directPlaywrightPackage) {
    throw new Error("E2E refuses a non-local @playwright/test resolution.");
  }
  const playwrightPackageRoot = path.dirname(directPlaywrightPackage);
  const playwrightCliPath = validateExecutable(
    localRequire.resolve("@playwright/test/cli"),
    "Playwright CLI",
  );
  const playwrightCliRelative = path.relative(
    playwrightPackageRoot,
    playwrightCliPath,
  );
  if (
    !playwrightCliRelative ||
    playwrightCliRelative === ".." ||
    playwrightCliRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(playwrightCliRelative)
  ) {
    throw new Error("E2E Playwright CLI escaped its direct local package.");
  }
  const playwrightPackage = readJson(
    directPlaywrightPackage,
    "installed Playwright package",
  );
  const declaredPlaywright =
    packageJson.devDependencies?.["@playwright/test"] ??
    packageJson.dependencies?.["@playwright/test"];
  if (
    typeof declaredPlaywright !== "string" ||
    playwrightPackage.version !== declaredPlaywright
  ) {
    throw new Error(
      "E2E requires one exact installed @playwright/test version.",
    );
  }
  return Object.freeze({ nodeExecutable, playwrightCliPath, pnpmCliPath });
}

export function validatePlaywrightArguments(args) {
  for (const argument of args) {
    if (
      typeof argument !== "string" ||
      argument.includes("\0") ||
      FORBIDDEN_PLAYWRIGHT_ARGUMENTS.some(
        (option) => argument === option || argument.startsWith(`${option}=`),
      ) ||
      ["-b", "-c", "-j", "-u"].some((option) => argument.startsWith(option))
    ) {
      throw new Error(
        `${String(argument)} cannot override the hermetic E2E configuration.`,
      );
    }
  }
  return Object.freeze([...args]);
}

function validateConfiguration(configured, repoRoot, context) {
  if (!configured || typeof configured !== "object") {
    throw new Error("E2E product configuration is required.");
  }
  const configPath = canonicalContainedFile(
    repoRoot,
    configured.configPath,
    "Playwright config",
  );
  const scriptPath = canonicalContainedFile(
    repoRoot,
    configured.controller?.scriptPath,
    "E2E controller",
  );
  if (
    configPath !== configured.configPath ||
    scriptPath !== configured.controller.scriptPath
  ) {
    throw new Error("E2E configuration paths must already be canonical.");
  }
  const sourcePolicy = validateHermeticPlaywrightSourcePolicy({
    configPath,
    repoRoot,
    testDirectory: configured.testDirectory,
  });
  if (sourcePolicy.testDirectory !== configured.testDirectory) {
    throw new Error("Playwright test directory must already be canonical.");
  }
  const controllerEnvironment = exactEnvironment(
    "controller",
    configured.controller.environment,
  );
  const requiredControllerEnvironment = {
    CX_E2E_BASE_URL: context.runtime.baseUrl,
    CX_E2E_OWNER_MARKER: context.runtime.markerPath,
    CX_E2E_OWNER_NONCE: context.runtime.ownerNonce,
    CX_E2E_OWNER_PID: String(context.runtime.ownerPid),
    CX_E2E_PNPM_CLI_PATH: context.pnpmCliPath,
    CX_E2E_PORT: String(context.port),
    CX_E2E_PRODUCT_ID: context.runtime.productId,
    CX_E2E_PROXY_URL: context.proxyUrl,
    CX_E2E_TEMP_PARENT: context.runtime.tempParent,
    CX_E2E_TEMP_ROOT: context.runtime.root,
    PATH: context.pathValue,
    TMPDIR: context.runtime.runtimeTemp,
    [PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_KEY]:
      PNPM_VERIFY_DEPS_BEFORE_RUN_ENVIRONMENT_VALUE,
  };
  for (const [name, expected] of Object.entries(
    requiredControllerEnvironment,
  )) {
    if (controllerEnvironment[name] !== expected) {
      throw new Error(`E2E controller environment has an invalid ${name}.`);
    }
  }
  if (!new Set(["", "1"]).has(controllerEnvironment.CI)) {
    throw new Error("E2E controller CI must be normalized to empty or 1.");
  }
  validatedStartupTimeout(configured.controller.startupTimeoutMs);
  if (Object.hasOwn(configured.controller, "healthPath")) {
    throw new Error("E2E readiness is fixed to /healthz.");
  }
}

function runtimeFromEnvironment() {
  const productId = requiredEnvironment(process.env, "CX_E2E_PRODUCT_ID");
  return validateOwnedE2ERuntime({ productId });
}

function hermeticManualOptions(options, runtime, browserContext) {
  assertPlainObject(options, "Manual Playwright options");
  for (const key of Object.keys(options)) {
    if (PLAYWRIGHT_NETWORK_OPTION_KEYS.has(key)) {
      throw new Error(`Manual Playwright options cannot override ${key}.`);
    }
  }
  return Object.freeze({
    ...options,
    baseURL: runtime.baseUrl,
    proxy: Object.freeze({ server: runtime.proxyUrl }),
    ...(browserContext ? { serviceWorkers: "block" } : {}),
  });
}

function assertPlainObject(value, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${label} must be one plain object.`);
  }
}

function explicitProductChildEnvironment(environment) {
  assertPlainObject(environment, "Product-owned E2E child environment");
  const copy = {};
  for (const [key, value] of Object.entries(environment)) {
    const allowedPackageManagerConfiguration =
      NPM_CONFIG_FENCE_KEYS.has(key) && value === "/dev/null";
    if (
      !/^[A-Z][A-Z0-9_]*$/.test(key) ||
      typeof value !== "string" ||
      value.includes("\0") ||
      key.startsWith("CX_E2E_") ||
      key === "NODE_OPTIONS" ||
      (forbiddenEnvironmentKey(key) && !allowedPackageManagerConfiguration)
    ) {
      throw new Error(
        `Product-owned E2E child environment contains an invalid ${key} value.`,
      );
    }
    copy[key] = value;
  }
  return Object.freeze(copy);
}

function normalizedCi(value) {
  return value === "1" || value === "true" ? "1" : "";
}
