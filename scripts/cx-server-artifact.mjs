#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  readlink,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";

import {
  MAX_SERVER_RELEASE_ARTIFACT_BYTES,
  MAX_SERVER_RELEASE_ARTIFACT_ENTRIES,
  parseServerReleaseArtifactDeclaration,
} from "../dist/server/server-identity.js";
import {
  parseWorkspaceContract,
  stripYamlComment,
  yamlScalar,
} from "./workspace-contract.mjs";

const PNPM_VERSION = "11.23.0";
const PACKAGE_MANAGER =
  "pnpm@11.23.0+sha512.f00082e5b283a199b74e079da28d155c008fe232f44c8a06ea7ddfa014ecf719fc362f790ecc67b28106ddac2afb24c49a9a079159da560b2ce7d1e98efd11af";
const NODE_ENGINE = ">=26 <27";
const NODE_MAJOR = 26;
const FRAMEWORK_PACKAGE_NAME = "@mikaelcedergren/cx-framework";
const FRAMEWORK_PACKAGE_PATH_PARTS = Object.freeze([
  "node_modules",
  "@mikaelcedergren",
  "cx-framework",
]);
const FRAMEWORK_PACKAGE_ROOT_FILES = new Set([
  "PACKAGING.md",
  "README.md",
  "package.json",
]);
const FRAMEWORK_PACKAGE_ROOT_DIRECTORIES = new Set([
  "ai",
  "dist",
  "fonts",
  "icons",
  "platform",
  "scripts",
  "styles",
  "support",
  "tokens",
]);
const FRAMEWORK_PACKAGE_RUNTIME_SCRIPTS = new Set([
  "check-product.mjs",
  "cx-server-artifact.mjs",
  "install-ai-skills.mjs",
  "workspace-contract.mjs",
]);
const SERVER_WORKSPACE_PATH = "server";
const SERVER_ARTIFACT_PATH = "server";
const PRODUCT_MANIFEST_NAME = "cx-product.json";
const PACKAGE_MANIFEST_NAME = "package.json";
const WORKSPACE_MANIFEST_NAME = "pnpm-workspace.yaml";
const LOCKFILE_NAME = "pnpm-lock.yaml";
const MAX_ARTIFACT_DEPTH = 64;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_WORKSPACE_BYTES = 1024 * 1024;
const MAX_LOCKFILE_BYTES = 64 * 1024 * 1024;
const PATH_SCAN_CHUNK_BYTES = 64 * 1024;
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/;
const PRODUCT_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SAFE_PATH_PART_PATTERN = /^[a-z0-9._-]+$/i;
const SOURCE_FILE_PATTERN = /(?:\.d)?\.(?:cts|mts|ts|tsx)$|\.map$/i;
const SOURCE_DIRECTORY_NAMES = new Set([
  "__tests__",
  "spec",
  "src",
  "test",
  "tests",
]);
const ROOT_RECEIPT_NAMES = new Set([
  "pnpm-lock.yaml",
  "pnpm-lock.yml",
  "pnpm-workspace.yaml",
]);
const NODE_MODULE_RECEIPT_NAMES = new Set([
  ".package-map.json",
  ".modules.yaml",
  ".pnpm-workspace-state.json",
  ".pnpm-workspace-state-v1.json",
]);
const RUNTIME_PACKAGE_FIELDS = [
  "name",
  "version",
  "private",
  "type",
  "engines",
  "main",
  "exports",
  "imports",
];

function printHelp() {
  console.log(`Build one self-contained Node 26 server artifact.

Usage:
  cx-server-artifact --package <exact-workspace-package-name>

Required environment:
  SERVER_RELEASE_ARTIFACT_DIR  Existing, empty, canonical absolute artifact directory
  SERVER_RELEASE_ENTRYPOINT    Compiled artifact entrypoint under server/dist/
  SERVER_RELEASE_WORKERS       JSON array of declared worker identities

The current directory must be the product repository root. The exact package must be the
explicit server/ workspace package and must declare a literal package.json files allowlist.
`);
}

export function parseArguments(argv) {
  let packageName;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--help" || argument === "-h") {
      return Object.freeze({ help: true });
    }
    if (argument === "--package") {
      if (packageName !== undefined) {
        throw new Error("--package may be provided only once.");
      }
      packageName = argv[index + 1];
      if (!packageName)
        throw new Error("--package requires an exact package name.");
      index += 1;
      continue;
    }
    if (argument.startsWith("--package=")) {
      if (packageName !== undefined) {
        throw new Error("--package may be provided only once.");
      }
      packageName = argument.slice("--package=".length);
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }

  assertPackageName(packageName);
  return Object.freeze({ help: false, packageName });
}

export async function buildServerArtifact({
  packageName,
  root = process.cwd(),
  environment = process.env,
  runCommand = runProcess,
} = {}) {
  assertPackageName(packageName);
  assertNodeVersion();

  const repositoryRoot = await canonicalDirectory(root, "Repository root");
  const artifactRoot = await resolveArtifactRoot(environment);
  const declaration = releaseDeclarationFrom(environment);
  assertNestedEntrypoints(declaration);

  const rootPackageFile = path.join(repositoryRoot, PACKAGE_MANIFEST_NAME);
  const workspaceFile = path.join(repositoryRoot, WORKSPACE_MANIFEST_NAME);
  const lockfile = path.join(repositoryRoot, LOCKFILE_NAME);
  const manifestFile = path.join(repositoryRoot, PRODUCT_MANIFEST_NAME);
  const [rootPackage, workspaceSource, lockfileSource, manifestSource] =
    await Promise.all([
      readJsonRecord(rootPackageFile, "Root package manifest", MAX_JSON_BYTES),
      readStableText(
        workspaceFile,
        "pnpm workspace manifest",
        MAX_WORKSPACE_BYTES,
      ),
      readStableText(lockfile, "pnpm lockfile", MAX_LOCKFILE_BYTES),
      readStableFile(manifestFile, "Product manifest", MAX_JSON_BYTES),
    ]);

  validateRootPackage(rootPackage);
  const workspacePackages = parseWorkspaceManifest(workspaceSource);
  if (!workspacePackages.includes(SERVER_WORKSPACE_PATH)) {
    throw new Error(
      `The pnpm workspace must explicitly list the ${SERVER_WORKSPACE_PATH}/ package.`,
    );
  }
  validateLockfile(lockfileSource, SERVER_WORKSPACE_PATH);
  const physicalFrameworkOverride = await resolvePhysicalFrameworkOverride({
    lockfileSource,
    repositoryRoot,
    rootPackage,
    workspaceSource,
  });

  const productManifest = parseJsonRecord(manifestSource, "Product manifest");
  if (
    productManifest.schemaVersion !== 1 ||
    productManifest.family !== "web" ||
    typeof productManifest.id !== "string" ||
    !PRODUCT_ID_PATTERN.test(productManifest.id)
  ) {
    throw new Error(
      "Product manifest must declare schemaVersion 1, family web, and a canonical product id.",
    );
  }
  const expectedPackageName = `${productManifest.id}-server`;
  if (packageName !== expectedPackageName) {
    throw new Error(
      `Server workspace package name must be ${expectedPackageName} for product ${productManifest.id}.`,
    );
  }

  const serverSourceRoot = await canonicalDirectory(
    path.join(repositoryRoot, SERVER_WORKSPACE_PATH),
    "Server workspace package",
  );
  if (!isInside(repositoryRoot, serverSourceRoot)) {
    throw new Error(
      "Server workspace package must stay inside the repository.",
    );
  }
  const serverPackage = await readJsonRecord(
    path.join(serverSourceRoot, PACKAGE_MANIFEST_NAME),
    "Server package manifest",
    MAX_JSON_BYTES,
  );
  validateServerPackage(serverPackage, packageName);
  const packagedPaths = packageFileDeclarations(serverPackage.files);

  const serverArtifactRoot = path.join(artifactRoot, SERVER_ARTIFACT_PATH);
  let deployRoot = serverArtifactRoot;
  let physicalDeployScratch;
  if (physicalFrameworkOverride) {
    physicalDeployScratch = await preparePhysicalFrameworkDeploy({
      artifactRoot,
      override: physicalFrameworkOverride,
    });
    deployRoot = physicalDeployScratch.deployRoot;
  } else {
    await mkdir(serverArtifactRoot, { mode: 0o755, recursive: false });
  }
  const artifactManifestFile = path.join(artifactRoot, PRODUCT_MANIFEST_NAME);
  try {
    const commandEnvironment = {
      ...environment,
      COREPACK_ENABLE_NETWORK: "0",
      pnpm_config_offline: "true",
    };
    const versionResult = await runCommand("corepack", ["pnpm", "--version"], {
      capture: true,
      cwd: repositoryRoot,
      environment: commandEnvironment,
    });
    if (versionResult.stdout.trim() !== PNPM_VERSION) {
      throw new Error(
        `cx-server-artifact requires pnpm ${PNPM_VERSION}; Corepack resolved ${JSON.stringify(versionResult.stdout.trim())}.`,
      );
    }

    if (physicalFrameworkOverride) {
      // pnpm's shared-lock deploy intentionally removes overrides from the generated deploy
      // lockfile. Prove the source workspace and lock agree first, then clear only the deploy
      // subprocess' already-materialized override configuration so its frozen isolated install
      // compares like-for-like. The exact tarball is copied into owned staging below and its lock
      // integrity is still verified by that isolated install.
      await runCommand(
        "corepack",
        [
          "pnpm",
          "--offline",
          "--frozen-lockfile",
          "--ignore-scripts",
          "--lockfile-only",
          "install",
        ],
        {
          capture: false,
          cwd: repositoryRoot,
          environment: commandEnvironment,
        },
      );
      const [workspaceAfterPreflight, lockfileAfterPreflight] =
        await Promise.all([
          readStableText(
            workspaceFile,
            "pnpm workspace manifest",
            MAX_WORKSPACE_BYTES,
          ),
          readStableText(lockfile, "pnpm lockfile", MAX_LOCKFILE_BYTES),
        ]);
      if (
        workspaceAfterPreflight !== workspaceSource ||
        lockfileAfterPreflight !== lockfileSource
      ) {
        throw new Error(
          "Physical cx-framework frozen preflight changed the workspace manifest or lockfile.",
        );
      }
    }

    await removeServerBuildOutput(serverSourceRoot);
    await runCommand(
      "corepack",
      [
        "pnpm",
        "--filter",
        `./${SERVER_WORKSPACE_PATH}`,
        "--fail-if-no-match",
        "run",
        "build",
      ],
      {
        capture: false,
        cwd: repositoryRoot,
        environment: commandEnvironment,
      },
    );
    await validatePackageFiles(serverSourceRoot, packagedPaths);

    try {
      const deployArguments = [
        "pnpm",
        "--offline",
        "--frozen-lockfile",
        "--ignore-scripts",
        "--package-import-method=copy",
        "--config.prefer-symlinked-executables=true",
        ...(physicalFrameworkOverride ? ["--config.overrides=null"] : []),
        "--filter",
        `./${SERVER_WORKSPACE_PATH}`,
        "--fail-if-no-match",
        "deploy",
        "--prod",
        deployRoot,
      ];
      await runCommand("corepack", deployArguments, {
        capture: false,
        cwd: repositoryRoot,
        environment: commandEnvironment,
      });
      if (physicalFrameworkOverride) {
        assertSamePhysicalTarballSnapshot(
          physicalFrameworkOverride.sourceSnapshot,
          await physicalTarballSnapshot(
            physicalFrameworkOverride.canonicalPath,
            "Physical cx-framework override",
          ),
        );
      }
    } catch (error) {
      throw new Error(
        `Offline pnpm deploy failed for exact workspace package ./${SERVER_WORKSPACE_PATH}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? { cause: error } : undefined,
      );
    }

    if (physicalDeployScratch) {
      await rename(physicalDeployScratch.deployRoot, serverArtifactRoot);
      await rm(physicalDeployScratch.root, { force: true, recursive: true });
      physicalDeployScratch = undefined;
    }

    await stripPnpmReceipts(serverArtifactRoot);
    await normalizeDeployedPackage(serverArtifactRoot, packageName);
    await writeFile(artifactManifestFile, manifestSource, {
      flag: constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      mode: 0o644,
    });
    await validatePackagedPaths(serverArtifactRoot, packagedPaths);
    const validation = await validateArtifact({
      artifactRoot,
      declaration,
      repositoryRoot,
    });

    return Object.freeze({
      artifactRoot,
      packageName,
      artifactBytes: validation.artifactBytes,
      artifactEntries: validation.artifactEntries,
      entrypoint: declaration.entrypoint,
      workers: declaration.workers,
    });
  } catch (error) {
    try {
      await Promise.all([
        rm(serverArtifactRoot, { force: true, recursive: true }),
        rm(artifactManifestFile, { force: true }),
        ...(physicalDeployScratch
          ? [rm(physicalDeployScratch.root, { force: true, recursive: true })]
          : []),
      ]);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Server artifact build failed and its exact owned staging entries could not be removed.",
      );
    }
    throw error;
  }
}

function assertPackageName(value) {
  if (
    typeof value !== "string" ||
    !PACKAGE_NAME_PATTERN.test(value) ||
    value.includes("...")
  ) {
    throw new Error(
      "--package must be one exact npm package name, not a pnpm filter expression.",
    );
  }
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split(".", 1)[0]);
  if (major !== NODE_MAJOR) {
    throw new Error(
      `cx-server-artifact requires Node ${NODE_MAJOR}; found ${process.versions.node}.`,
    );
  }
}

async function canonicalDirectory(candidate, label) {
  const resolved = path.resolve(candidate);
  let entry;
  try {
    entry = await lstat(resolved);
  } catch (error) {
    throw new Error(`${label} does not exist: ${resolved}`, { cause: error });
  }
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error(`${label} must be a real directory: ${resolved}`);
  }
  return realpath(resolved);
}

async function resolveArtifactRoot(environment) {
  const configured = requiredEnvironmentValue(
    environment,
    "SERVER_RELEASE_ARTIFACT_DIR",
  );
  if (
    !path.isAbsolute(configured) ||
    path.normalize(configured) !== configured
  ) {
    throw new Error(
      "SERVER_RELEASE_ARTIFACT_DIR must be a normalized absolute path without aliases.",
    );
  }
  const entry = await lstat(configured);
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error("SERVER_RELEASE_ARTIFACT_DIR must be a real directory.");
  }
  const canonical = await realpath(configured);
  if (canonical !== configured) {
    throw new Error(
      "SERVER_RELEASE_ARTIFACT_DIR must already be its canonical real path.",
    );
  }
  if ((await readdir(canonical)).length !== 0) {
    throw new Error("SERVER_RELEASE_ARTIFACT_DIR must be empty.");
  }
  return canonical;
}

function releaseDeclarationFrom(environment) {
  const entrypoint = requiredEnvironmentValue(
    environment,
    "SERVER_RELEASE_ENTRYPOINT",
  );
  const source = requiredEnvironmentValue(
    environment,
    "SERVER_RELEASE_WORKERS",
  );
  let workers;
  try {
    workers = JSON.parse(source);
  } catch (error) {
    throw new Error("SERVER_RELEASE_WORKERS must contain valid JSON.", {
      cause: error,
    });
  }
  return parseServerReleaseArtifactDeclaration({ entrypoint, workers });
}

function assertNestedEntrypoints(declaration) {
  for (const [label, entrypoint] of [
    ["HTTP entrypoint", declaration.entrypoint],
    ...declaration.workers.map((worker) => [
      `Worker ${worker.key} entrypoint`,
      worker.entrypoint,
    ]),
  ]) {
    if (!entrypoint.startsWith(`${SERVER_ARTIFACT_PATH}/dist/`)) {
      throw new Error(`${label} must be compiled beneath server/dist/.`);
    }
  }
}

function requiredEnvironmentValue(environment, key) {
  const value = environment?.[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

function validateRootPackage(packageJson) {
  if (packageJson.packageManager !== PACKAGE_MANAGER) {
    throw new Error(`Root packageManager must be exactly ${PACKAGE_MANAGER}.`);
  }
  if (packageJson.engines?.node !== NODE_ENGINE) {
    throw new Error(`Root engines.node must be exactly ${NODE_ENGINE}.`);
  }
}

function validateServerPackage(packageJson, packageName) {
  if (packageJson.name !== packageName) {
    throw new Error(
      `The server workspace package must be named ${packageName}; found ${JSON.stringify(packageJson.name)}.`,
    );
  }
  if (packageJson.type !== "module") {
    throw new Error(
      'The server workspace package must declare "type": "module".',
    );
  }
  if (packageJson.engines?.node !== NODE_ENGINE) {
    throw new Error(`Server engines.node must be exactly ${NODE_ENGINE}.`);
  }
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    throw new Error(
      "The server workspace package must declare a non-empty files allowlist.",
    );
  }
  if (
    typeof packageJson.scripts?.build !== "string" ||
    packageJson.scripts.build.trim().length === 0
  ) {
    throw new Error(
      "The server workspace package must declare one build script.",
    );
  }
  if (
    packageJson.scripts.prebuild !== undefined ||
    packageJson.scripts.postbuild !== undefined
  ) {
    throw new Error(
      "Server package prebuild and postbuild lifecycle scripts are forbidden.",
    );
  }
}

export function parseWorkspaceManifest(source) {
  const contract = parseWorkspaceContract(source);
  if (contract.injectWorkspacePackages !== true) {
    throw new Error(
      "pnpm-workspace.yaml must set injectWorkspacePackages: true.",
    );
  }
  if (contract.autoInstallPeers !== false) {
    throw new Error("pnpm-workspace.yaml must set autoInstallPeers: false.");
  }
  if (contract.dedupePeerDependents !== false) {
    throw new Error(
      "pnpm-workspace.yaml must set dedupePeerDependents: false.",
    );
  }
  if (contract.enableGlobalVirtualStore !== false) {
    throw new Error(
      "pnpm-workspace.yaml must set enableGlobalVirtualStore: false.",
    );
  }
  if (contract.syncInjectedDepsAfterScripts !== "[]") {
    throw new Error(
      "pnpm-workspace.yaml must set syncInjectedDepsAfterScripts: [].",
    );
  }
  if (contract.resolvePeersFromWorkspaceRoot !== false) {
    throw new Error(
      "pnpm-workspace.yaml must set resolvePeersFromWorkspaceRoot: false.",
    );
  }
  if (contract.strictStorePkgContentCheck !== true) {
    throw new Error(
      "pnpm-workspace.yaml must set strictStorePkgContentCheck: true.",
    );
  }
  if (contract.strictDepBuilds !== true) {
    throw new Error("pnpm-workspace.yaml must set strictDepBuilds: true.");
  }
  if (contract.verifyDepsBeforeRun !== "error") {
    throw new Error("pnpm-workspace.yaml must set verifyDepsBeforeRun: error.");
  }
  if (contract.verifyStoreIntegrity !== true) {
    throw new Error("pnpm-workspace.yaml must set verifyStoreIntegrity: true.");
  }
  if (contract.dangerouslyAllowAllBuilds === true) {
    throw new Error(
      "pnpm-workspace.yaml must not set dangerouslyAllowAllBuilds: true.",
    );
  }
  return contract.packagePaths;
}

export function validateLockfile(source, importer) {
  const lines = source.split(/\r?\n/);
  const version = topLevelLockScalar(lines, "lockfileVersion");
  if (version !== "9.0") {
    throw new Error("pnpm-lock.yaml lockfileVersion must be 9.0.");
  }
  const settings = yamlBlock(lines, "settings");
  if (blockScalar(settings, "autoInstallPeers") !== "false") {
    throw new Error("pnpm-lock.yaml must record autoInstallPeers: false.");
  }
  if (blockScalar(settings, "injectWorkspacePackages") !== "true") {
    throw new Error(
      "pnpm-lock.yaml must record injectWorkspacePackages: true.",
    );
  }
  const resolvedPeers = blockScalar(settings, "resolvePeersFromWorkspaceRoot");
  if (resolvedPeers !== undefined && resolvedPeers !== "false") {
    throw new Error(
      "pnpm-lock.yaml must not enable resolvePeersFromWorkspaceRoot.",
    );
  }
  const importers = yamlBlock(lines, "importers");
  const importerNames = importers
    .map((line) => stripYamlComment(line).match(/^  ([^\s].*?):\s*$/))
    .filter(Boolean)
    .map((match) => yamlScalar(match[1]));
  if (!importerNames.includes(importer)) {
    throw new Error(
      `pnpm-lock.yaml must contain the ${importer} workspace importer.`,
    );
  }
}

async function resolvePhysicalFrameworkOverride({
  lockfileSource,
  repositoryRoot,
  rootPackage,
  workspaceSource,
}) {
  const rootOverrides = rootPackage.pnpm?.overrides;
  if (
    isRecord(rootOverrides) &&
    Object.hasOwn(rootOverrides, FRAMEWORK_PACKAGE_NAME)
  ) {
    throw new Error(
      `Physical ${FRAMEWORK_PACKAGE_NAME} validation must declare its override in pnpm-workspace.yaml so pnpm 11 has one workspace-owned configuration source.`,
    );
  }

  const entries = workspaceOverrideEntries(workspaceSource);
  if (entries.length === 0) return undefined;
  if (entries.length !== 1 || entries[0].name !== FRAMEWORK_PACKAGE_NAME) {
    throw new Error(
      `Server artifact workspaces may use only one temporary override, for ${FRAMEWORK_PACKAGE_NAME}.`,
    );
  }

  const configured = entries[0].value;
  if (!configured.startsWith("file:")) {
    throw new Error(
      `The ${FRAMEWORK_PACKAGE_NAME} workspace override must be one physical file: tarball.`,
    );
  }
  const configuredPath = configured.slice("file:".length);
  if (
    !path.isAbsolute(configuredPath) ||
    path.normalize(configuredPath) !== configuredPath ||
    path.extname(configuredPath).toLowerCase() !== ".tgz"
  ) {
    throw new Error(
      `The ${FRAMEWORK_PACKAGE_NAME} workspace override must use one normalized absolute .tgz path.`,
    );
  }
  const sourceSnapshot = await physicalTarballSnapshot(
    configuredPath,
    "Physical cx-framework override",
  );
  const canonicalPath = await realpath(configuredPath);
  if (canonicalPath !== configuredPath) {
    throw new Error(
      `The ${FRAMEWORK_PACKAGE_NAME} workspace override path must already be canonical and contain no symbolic-link boundary.`,
    );
  }

  const lockPath = lockedFrameworkTarballPath(lockfileSource);
  const lockResolved = path.resolve(repositoryRoot, ...lockPath.split("/"));
  if (lockResolved !== canonicalPath) {
    throw new Error(
      `pnpm-lock.yaml does not resolve ${FRAMEWORK_PACKAGE_NAME} to the exact workspace override tarball.`,
    );
  }

  return Object.freeze({
    canonicalPath,
    lockPath,
    sourceSnapshot,
  });
}

function workspaceOverrideEntries(source) {
  const lines = source.split(/\r?\n/);
  const starts = lines
    .map((line, index) => ({ index, line: stripYamlComment(line).trimEnd() }))
    .filter(({ line }) => line === "overrides:");
  if (starts.length === 0) return [];
  if (starts.length !== 1) {
    throw new Error(
      "pnpm-workspace.yaml must contain at most one overrides block.",
    );
  }

  const entries = [];
  const names = new Set();
  for (let index = starts[0].index + 1; index < lines.length; index += 1) {
    const line = stripYamlComment(lines[index]).trimEnd();
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) break;
    const match = line.match(/^  (.+?):\s+(.+)$/);
    if (!match) {
      throw new Error(
        "pnpm-workspace.yaml overrides must be exact two-space-indented scalar mappings.",
      );
    }
    const name = yamlScalar(match[1]);
    const value = yamlScalar(match[2]);
    if (names.has(name)) {
      throw new Error(
        `pnpm-workspace.yaml contains duplicate override ${name}.`,
      );
    }
    names.add(name);
    entries.push(Object.freeze({ name, value }));
  }
  return entries;
}

function lockedFrameworkTarballPath(source) {
  const packageLines = yamlBlock(source.split(/\r?\n/), "packages");
  const prefix = `${FRAMEWORK_PACKAGE_NAME}@file:`;
  const candidates = [];
  for (let index = 0; index < packageLines.length; index += 1) {
    const header = stripYamlComment(packageLines[index])
      .trimEnd()
      .match(/^  (.+):\s*$/);
    if (!header) continue;
    const key = yamlScalar(header[1]);
    if (!key.startsWith(prefix)) continue;
    let end = index + 1;
    while (end < packageLines.length) {
      const next = stripYamlComment(packageLines[end]).trimEnd();
      if (next.trim() && /^  \S/.test(next)) break;
      end += 1;
    }
    candidates.push({
      body: packageLines.slice(index + 1, end),
      lockPath: key.slice(prefix.length),
    });
  }
  if (candidates.length !== 1) {
    throw new Error(
      `pnpm-lock.yaml must contain exactly one physical ${FRAMEWORK_PACKAGE_NAME} package snapshot.`,
    );
  }

  const [{ body, lockPath }] = candidates;
  const parts = lockPath.split("/");
  const parentCount = parts.findIndex((part) => part !== "..");
  if (
    path.posix.isAbsolute(lockPath) ||
    path.posix.normalize(lockPath) !== lockPath ||
    lockPath.includes("\\") ||
    parentCount < 1 ||
    parts
      .slice(parentCount)
      .some((part) => !part || part === "." || part === "..") ||
    path.posix.extname(lockPath).toLowerCase() !== ".tgz"
  ) {
    throw new Error(
      `pnpm-lock.yaml ${FRAMEWORK_PACKAGE_NAME} tarball path must be one external canonical relative .tgz path.`,
    );
  }
  const expected = `tarball: file:${lockPath}`;
  if (
    body.filter((line) => stripYamlComment(line).includes(expected)).length !==
    1
  ) {
    throw new Error(
      `pnpm-lock.yaml ${FRAMEWORK_PACKAGE_NAME} resolution must name its exact physical tarball once.`,
    );
  }
  return lockPath;
}

async function preparePhysicalFrameworkDeploy({ artifactRoot, override }) {
  const root = path.join(artifactRoot, `.cx-framework-deploy-${randomUUID()}`);
  await mkdir(root, { mode: 0o700, recursive: false });
  try {
    const parentCount = override.lockPath
      .split("/")
      .findIndex((part) => part !== "..");
    const nesting = Array.from(
      { length: parentCount + 1 },
      (_, index) => `level-${index}`,
    );
    const deployRoot = path.join(root, "deploy", ...nesting, "server");
    await mkdir(path.dirname(deployRoot), { mode: 0o700, recursive: true });
    const stagedTarball = path.resolve(deployRoot, override.lockPath);
    if (
      !isInside(root, stagedTarball) ||
      isInsideOrEqual(deployRoot, stagedTarball)
    ) {
      throw new Error(
        "Physical cx-framework staging path escaped its exact owned deploy scratch directory.",
      );
    }
    await mkdir(path.dirname(stagedTarball), {
      mode: 0o700,
      recursive: true,
    });
    await copyStablePhysicalTarball(override, stagedTarball);
    return { deployRoot, root };
  } catch (error) {
    await rm(root, { force: true, recursive: true });
    throw error;
  }
}

async function physicalTarballSnapshot(file, label) {
  let snapshot;
  try {
    snapshot = await lstat(file, { bigint: true });
  } catch (error) {
    throw new Error(`${label} is missing: ${file}`, { cause: error });
  }
  if (
    snapshot.isSymbolicLink() ||
    !snapshot.isFile() ||
    snapshot.nlink !== 1n ||
    snapshot.size < 1n ||
    snapshot.size > BigInt(MAX_SERVER_RELEASE_ARTIFACT_BYTES)
  ) {
    throw new Error(
      `${label} must be one owned regular non-linked file within the server artifact byte ceiling.`,
    );
  }
  return Object.freeze({
    dev: snapshot.dev,
    ino: snapshot.ino,
    mtimeNs: snapshot.mtimeNs,
    size: snapshot.size,
  });
}

async function copyStablePhysicalTarball(override, destination) {
  const before = await physicalTarballSnapshot(
    override.canonicalPath,
    "Physical cx-framework override",
  );
  assertSamePhysicalTarballSnapshot(override.sourceSnapshot, before);
  await copyFile(override.canonicalPath, destination, constants.COPYFILE_EXCL);
  const [after, copied] = await Promise.all([
    physicalTarballSnapshot(
      override.canonicalPath,
      "Physical cx-framework override",
    ),
    physicalTarballSnapshot(
      destination,
      "Staged physical cx-framework tarball",
    ),
  ]);
  assertSamePhysicalTarballSnapshot(before, after);
  if (copied.size !== before.size) {
    throw new Error(
      "Staged physical cx-framework tarball changed size during its owned copy.",
    );
  }
}

function assertSamePhysicalTarballSnapshot(expected, actual) {
  if (
    expected.dev !== actual.dev ||
    expected.ino !== actual.ino ||
    expected.size !== actual.size ||
    expected.mtimeNs !== actual.mtimeNs
  ) {
    throw new Error(
      "Physical cx-framework override changed while the server artifact was built.",
    );
  }
}

export function boundedArtifactByteTotal(current, additional) {
  if (
    !Number.isSafeInteger(current) ||
    current < 0 ||
    !Number.isSafeInteger(additional) ||
    additional < 0
  ) {
    throw new Error(
      "Server artifact byte accounting must use non-negative safe integers.",
    );
  }
  const total = current + additional;
  if (
    !Number.isSafeInteger(total) ||
    total > MAX_SERVER_RELEASE_ARTIFACT_BYTES
  ) {
    throw new Error(
      `Server artifact exceeds ${MAX_SERVER_RELEASE_ARTIFACT_BYTES} bytes.`,
    );
  }
  return total;
}

function topLevelLockScalar(lines, key) {
  const pattern = new RegExp(`^${key}:\\s*(.*?)\\s*$`);
  const matches = lines
    .map((line) => stripYamlComment(line).match(pattern))
    .filter(Boolean);
  if (matches.length !== 1) {
    throw new Error(`pnpm-lock.yaml must contain exactly one ${key}.`);
  }
  return yamlScalar(matches[0][1]);
}

function yamlBlock(lines, key) {
  const starts = lines
    .map((line, index) => ({ index, line: stripYamlComment(line).trimEnd() }))
    .filter(({ line }) => line === `${key}:`);
  if (starts.length !== 1) {
    throw new Error(`pnpm-lock.yaml must contain exactly one ${key} block.`);
  }
  const block = [];
  for (let index = starts[0].index + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() && !/^\s/.test(line)) break;
    block.push(line);
  }
  return block;
}

function blockScalar(lines, key) {
  const pattern = new RegExp(`^  ${key}:\\s*(.*?)\\s*$`);
  const matches = lines
    .map((line) => stripYamlComment(line).match(pattern))
    .filter(Boolean);
  return matches.length === 1 ? yamlScalar(matches[0][1]) : undefined;
}

function packageFileDeclarations(files) {
  const packagedPaths = [];
  const seen = new Set();
  for (const configured of files) {
    if (typeof configured !== "string" || configured.trim() !== configured) {
      throw new Error("Server package files entries must be exact strings.");
    }
    const directory = configured.endsWith("/");
    const relative = directory ? configured.slice(0, -1) : configured;
    assertPackagedPath(relative);
    if (seen.has(relative)) {
      throw new Error(
        `Server package files contains a duplicate path: ${relative}`,
      );
    }
    seen.add(relative);
    packagedPaths.push(Object.freeze({ directory, relative }));
  }
  if (
    !packagedPaths.some(
      ({ directory, relative }) => directory && relative === "dist",
    )
  ) {
    throw new Error('Server package files must explicitly contain "dist/".');
  }
  return Object.freeze(packagedPaths);
}

async function validatePackageFiles(serverSourceRoot, packagedPaths) {
  for (const { directory, relative } of packagedPaths) {
    const sourcePath = path.join(serverSourceRoot, ...relative.split("/"));
    let entry;
    try {
      entry = await lstat(sourcePath);
    } catch (error) {
      throw new Error(
        `Server package files path is missing after build: ${relative}`,
        {
          cause: error,
        },
      );
    }
    if (
      entry.isSymbolicLink() ||
      (directory ? !entry.isDirectory() : !entry.isFile())
    ) {
      throw new Error(
        `Server package files path has the wrong type or is a symlink: ${relative}`,
      );
    }
    await validatePackagedSource(sourcePath, relative);
  }
}

async function removeServerBuildOutput(serverSourceRoot) {
  const dist = path.join(serverSourceRoot, "dist");
  let entry;
  try {
    entry = await lstat(dist);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error(
      "Server build output must be a real dist directory before cleanup.",
    );
  }
  if ((await realpath(dist)) !== dist) {
    throw new Error(
      "Server build output must be its exact canonical dist directory.",
    );
  }
  await rm(dist, { force: true, recursive: true });
}

async function validatePackagedSource(sourcePath, relative) {
  async function visit(candidate, candidateRelative) {
    const entry = await lstat(candidate, { bigint: true });
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Server package files must not contain symlinks: ${candidateRelative}`,
      );
    }
    if (entry.isDirectory()) {
      assertNoSourceDirectory(candidateRelative);
      const children = await readdir(candidate, { withFileTypes: true });
      for (const child of children) {
        await visit(
          path.join(candidate, child.name),
          path.posix.join(candidateRelative, child.name),
        );
      }
      return;
    }
    if (entry.isFile()) {
      assertNoSourceFile(candidateRelative);
      return;
    }
    throw new Error(
      `Server package files contain a special entry: ${candidateRelative}`,
    );
  }
  await visit(sourcePath, relative);
}

function assertPackagedPath(relative) {
  const parts = relative.split("/");
  if (
    !relative ||
    relative === PRODUCT_MANIFEST_NAME ||
    relative === PACKAGE_MANIFEST_NAME ||
    relative.includes("\\") ||
    parts.some(
      (part) =>
        part === "." ||
        part === ".." ||
        !SAFE_PATH_PART_PATTERN.test(part) ||
        /[*?\[\]{}!]/.test(part),
    ) ||
    [".git", ".run", "node_modules"].includes(parts[0])
  ) {
    throw new Error(
      `Server package files entries must be literal portable runtime paths: ${relative}`,
    );
  }
}

async function validatePackagedPaths(serverArtifactRoot, packagedPaths) {
  for (const { directory, relative } of packagedPaths) {
    const candidate = path.join(serverArtifactRoot, ...relative.split("/"));
    let entry;
    try {
      entry = await lstat(candidate);
    } catch (error) {
      throw new Error(
        `pnpm deploy omitted declared server package path: ${relative}`,
        {
          cause: error,
        },
      );
    }
    if (
      entry.isSymbolicLink() ||
      (directory ? !entry.isDirectory() : !entry.isFile())
    ) {
      throw new Error(`Deployed server package path is unsafe: ${relative}`);
    }
  }
}

async function stripPnpmReceipts(serverArtifactRoot) {
  for (const name of ROOT_RECEIPT_NAMES) {
    await rm(path.join(serverArtifactRoot, name), { force: true });
  }

  const nodeModulesRoot = path.join(serverArtifactRoot, "node_modules");
  let rootEntry;
  try {
    rootEntry = await lstat(nodeModulesRoot);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (rootEntry.isSymbolicLink() || !rootEntry.isDirectory()) {
    throw new Error("Deployed node_modules must be a real directory.");
  }

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (
        NODE_MODULE_RECEIPT_NAMES.has(entry.name) ||
        (entry.name === "lock.yaml" && path.basename(directory) === ".pnpm")
      ) {
        await rm(candidate, { force: true, recursive: true });
        continue;
      }
      if (entry.isDirectory()) await visit(candidate);
    }
  }

  await visit(nodeModulesRoot);
}

async function normalizeDeployedPackage(serverArtifactRoot, packageName) {
  const packageFile = path.join(serverArtifactRoot, PACKAGE_MANIFEST_NAME);
  const deployed = await readJsonRecord(
    packageFile,
    "Deployed server package manifest",
    MAX_JSON_BYTES,
  );
  if (deployed.name !== packageName || deployed.type !== "module") {
    throw new Error(
      "pnpm deploy changed the selected server package identity or module type.",
    );
  }
  if (deployed.engines?.node !== NODE_ENGINE) {
    throw new Error(
      "pnpm deploy changed the selected server Node engine contract.",
    );
  }

  const normalized = {};
  for (const field of RUNTIME_PACKAGE_FIELDS) {
    if (Object.hasOwn(deployed, field))
      normalized[field] = sortJson(deployed[field]);
  }
  normalized.private = true;
  await writeFile(packageFile, `${JSON.stringify(normalized, null, 2)}\n`, {
    mode: 0o644,
  });
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}

async function validateArtifact({ artifactRoot, declaration, repositoryRoot }) {
  const rootEntries = (await readdir(artifactRoot)).sort();
  const expectedRootEntries = [
    PRODUCT_MANIFEST_NAME,
    SERVER_ARTIFACT_PATH,
  ].sort();
  if (
    rootEntries.length !== expectedRootEntries.length ||
    rootEntries.some((entry, index) => entry !== expectedRootEntries[index])
  ) {
    throw new Error(
      `Server artifact root must contain exactly ${expectedRootEntries.join(" and ")}.`,
    );
  }

  const canonicalArtifactRoot = await realpath(artifactRoot);
  const pathNeedles = [
    ...new Set([repositoryRoot, artifactRoot, canonicalArtifactRoot]),
  ]
    .filter((value) => value.length > 1)
    .map((value) => Buffer.from(value));
  let artifactBytes = 0;
  let artifactEntries = 0;
  const regularFiles = new Map();

  async function visit(directory, relativeDirectory, depth) {
    if (depth > MAX_ARTIFACT_DEPTH) {
      throw new Error(
        `Server artifact exceeds ${MAX_ARTIFACT_DEPTH} path levels.`,
      );
    }
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) =>
      Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)),
    );
    for (const entry of entries) {
      if (/[\u0000-\u001f\u007f]/.test(entry.name)) {
        throw new Error(
          "Server artifact paths must not contain control characters.",
        );
      }
      const candidate = path.join(directory, entry.name);
      const relative = relativeDirectory
        ? path.posix.join(relativeDirectory, entry.name)
        : entry.name;
      assertNoAngularRuntime(relative);
      assertFrameworkPackageArtifactSurface(relative);
      let snapshot = await lstat(candidate, { bigint: true });
      artifactEntries += 1;
      if (artifactEntries > MAX_SERVER_RELEASE_ARTIFACT_ENTRIES) {
        throw new Error(
          `Server artifact exceeds ${MAX_SERVER_RELEASE_ARTIFACT_ENTRIES} entries.`,
        );
      }

      if (snapshot.isDirectory()) {
        if (isExecutableBinChild(relative)) {
          throw new Error(
            `pnpm executable bins may contain only relative symlinks: ${relative}`,
          );
        }
        assertNoSourceDirectory(relative);
        await chmod(candidate, 0o755);
        await visit(candidate, relative, depth + 1);
        continue;
      }
      if (snapshot.isFile()) {
        if (isExecutableBinChild(relative)) {
          throw new Error(
            `pnpm executable bins may contain only relative symlinks: ${relative}`,
          );
        }
        if (
          snapshot.nlink !== 1n &&
          relative.startsWith(`${SERVER_ARTIFACT_PATH}/node_modules/.pnpm/`)
        ) {
          await detachPnpmHardLink(candidate);
          snapshot = await lstat(candidate, { bigint: true });
        }
        if (snapshot.nlink !== 1n) {
          throw new Error(
            `Server artifact files must not be hard-linked: ${relative}`,
          );
        }
        artifactBytes = boundedArtifactByteTotal(
          artifactBytes,
          Number(snapshot.size),
        );
        assertNoSourceFile(relative);
        if (await fileContainsAny(candidate, pathNeedles)) {
          throw new Error(
            `Server artifact contains a mutable build-path receipt: ${relative}`,
          );
        }
        const executable = (snapshot.mode & 0o111n) !== 0n;
        await chmod(candidate, executable ? 0o755 : 0o644);
        regularFiles.set(relative, candidate);
        continue;
      }
      if (snapshot.isSymbolicLink()) {
        if (path.basename(relative) === ".bin") {
          throw new Error("The pnpm .bin owner must be a real directory.");
        }
        const target = await readlink(candidate);
        if (path.isAbsolute(target)) {
          throw new Error(
            `Server artifact symbolic links must be relative: ${relative}`,
          );
        }
        let canonicalTarget;
        try {
          canonicalTarget = await realpath(candidate);
        } catch (error) {
          throw new Error(
            `Server artifact symbolic link is dangling: ${relative}`,
            {
              cause: error,
            },
          );
        }
        if (!isInsideOrEqual(canonicalArtifactRoot, canonicalTarget)) {
          throw new Error(
            `Server artifact symbolic link escapes the artifact: ${relative}`,
          );
        }
        assertFrameworkPackageSymlinkTarget({
          canonicalArtifactRoot,
          canonicalTarget,
          relative,
        });
        artifactBytes = boundedArtifactByteTotal(
          artifactBytes,
          Buffer.byteLength(target),
        );
        continue;
      }
      throw new Error(
        `Server artifact contains a special filesystem entry: ${relative}`,
      );
    }
  }

  await visit(artifactRoot, "", 0);
  for (const [label, entrypoint] of [
    ["HTTP entrypoint", declaration.entrypoint],
    ...declaration.workers.map((worker) => [
      `Worker ${worker.key} entrypoint`,
      worker.entrypoint,
    ]),
  ]) {
    if (!regularFiles.has(entrypoint)) {
      throw new Error(
        `${label} must be a regular file in the artifact: ${entrypoint}`,
      );
    }
  }

  return Object.freeze({ artifactBytes, artifactEntries });
}

function assertNoAngularRuntime(relative) {
  const parts = relative.split("/");
  if (
    parts.includes("node_modules") &&
    parts.some((part) => part === "@angular" || part.startsWith("@angular+"))
  ) {
    throw new Error(
      `Server artifact must not contain Angular packages: ${relative}`,
    );
  }
}

function assertFrameworkPackageArtifactSurface(relative) {
  const parts = relative.split("/");
  for (let index = 0; index < parts.length; index += 1) {
    if (
      parts[index] !== FRAMEWORK_PACKAGE_PATH_PARTS[0] ||
      parts[index + 1] !== FRAMEWORK_PACKAGE_PATH_PARTS[1] ||
      parts[index + 2] !== FRAMEWORK_PACKAGE_PATH_PARTS[2]
    ) {
      continue;
    }

    const packageRelative = parts.slice(
      index + FRAMEWORK_PACKAGE_PATH_PARTS.length,
    );
    if (packageRelative.length === 0) continue;

    const [rootEntry, childEntry] = packageRelative;
    const allowedRootFile =
      packageRelative.length === 1 &&
      FRAMEWORK_PACKAGE_ROOT_FILES.has(rootEntry);
    const allowedRootDirectory =
      packageRelative.length === 1 &&
      FRAMEWORK_PACKAGE_ROOT_DIRECTORIES.has(rootEntry);
    const allowedDirectoryContent =
      rootEntry !== "scripts" &&
      FRAMEWORK_PACKAGE_ROOT_DIRECTORIES.has(rootEntry);
    const allowedRuntimeScript =
      rootEntry === "scripts" &&
      packageRelative.length === 2 &&
      FRAMEWORK_PACKAGE_RUNTIME_SCRIPTS.has(childEntry);

    if (
      allowedRootFile ||
      allowedRootDirectory ||
      allowedDirectoryContent ||
      allowedRuntimeScript
    ) {
      continue;
    }

    throw new Error(
      `Server artifact ${FRAMEWORK_PACKAGE_NAME} must contain only its published package surface: ${relative}`,
    );
  }
}

function assertFrameworkPackageSymlinkTarget({
  canonicalArtifactRoot,
  canonicalTarget,
  relative,
}) {
  if (!endsWithFrameworkPackagePath(relative.split("/"))) return;

  const targetParts = path
    .relative(canonicalArtifactRoot, canonicalTarget)
    .split(path.sep);
  if (endsWithFrameworkPackagePath(targetParts)) return;

  throw new Error(
    `Server artifact ${FRAMEWORK_PACKAGE_NAME} symlink must resolve to its exact contained package path: ${relative}`,
  );
}

function endsWithFrameworkPackagePath(parts) {
  const offset = parts.length - FRAMEWORK_PACKAGE_PATH_PARTS.length;
  return (
    offset >= 0 &&
    FRAMEWORK_PACKAGE_PATH_PARTS.every(
      (part, index) => parts[offset + index] === part,
    )
  );
}

function isExecutableBinChild(relative) {
  const parts = relative.split("/");
  const index = parts.indexOf(".bin");
  return index !== -1 && index < parts.length - 1;
}

async function detachPnpmHardLink(file) {
  const replacement = path.join(
    path.dirname(file),
    `.cx-detach-${randomUUID()}`,
  );
  try {
    await copyFile(file, replacement, constants.COPYFILE_EXCL);
    await rename(replacement, file);
  } finally {
    await rm(replacement, { force: true });
  }
}

function assertNoSourceDirectory(relative) {
  const parts = relative.split("/");
  if (parts.includes("node_modules")) return;
  if (parts.some((part) => SOURCE_DIRECTORY_NAMES.has(part.toLowerCase()))) {
    throw new Error(
      `Server artifact contains a source or test directory: ${relative}`,
    );
  }
  if (parts.some((part) => part === ".git" || part === ".run")) {
    throw new Error(
      `Server artifact contains repository/runtime control state: ${relative}`,
    );
  }
}

function assertNoSourceFile(relative) {
  const parts = relative.split("/");
  if (parts.includes("node_modules")) return;
  const name = parts.at(-1);
  if (
    SOURCE_FILE_PATTERN.test(name) ||
    name === ".env" ||
    name.startsWith(".env.") ||
    name === ".npmrc" ||
    name === ".pnpmfile.cjs" ||
    name.startsWith("tsconfig") ||
    ROOT_RECEIPT_NAMES.has(name)
  ) {
    throw new Error(
      `Server artifact contains source or build-control state: ${relative}`,
    );
  }
}

async function fileContainsAny(file, needles) {
  if (needles.length === 0) return false;
  const maximumNeedle = Math.max(...needles.map((needle) => needle.length));
  const handle = await open(file, constants.O_RDONLY);
  let carry = Buffer.alloc(0);
  try {
    const chunk = Buffer.alloc(PATH_SCAN_CHUNK_BYTES);
    while (true) {
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (bytesRead === 0) return false;
      const combined = Buffer.concat([carry, chunk.subarray(0, bytesRead)]);
      if (needles.some((needle) => combined.includes(needle))) return true;
      carry = combined.subarray(
        Math.max(0, combined.length - maximumNeedle + 1),
      );
    }
  } finally {
    await handle.close();
  }
}

async function readJsonRecord(file, label, maximumBytes) {
  return parseJsonRecord(
    await readStableFile(file, label, maximumBytes),
    label,
  );
}

function parseJsonRecord(source, label) {
  let parsed;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(source),
    );
  } catch (error) {
    throw new Error(`${label} must contain valid UTF-8 JSON.`, {
      cause: error,
    });
  }
  if (!isRecord(parsed)) {
    throw new Error(`${label} must contain one JSON object.`);
  }
  return parsed;
}

async function readStableText(file, label, maximumBytes) {
  const source = await readStableFile(file, label, maximumBytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(source);
  } catch (error) {
    throw new Error(`${label} must be valid UTF-8.`, { cause: error });
  }
}

async function readStableFile(file, label, maximumBytes) {
  let before;
  try {
    before = await lstat(file, { bigint: true });
  } catch (error) {
    throw new Error(`${label} is missing: ${file}`, { cause: error });
  }
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new Error(`${label} must be a regular non-symlink file: ${file}`);
  }
  if (before.size < 1n || before.size > BigInt(maximumBytes)) {
    throw new Error(
      `${label} must contain between 1 and ${maximumBytes} bytes.`,
    );
  }
  const source = await readFile(file);
  const after = await lstat(file, { bigint: true });
  if (
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs ||
    BigInt(source.byteLength) !== before.size
  ) {
    throw new Error(`${label} changed while it was read: ${file}`);
  }
  return source;
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".."
  );
}

function isInsideOrEqual(parent, candidate) {
  return parent === candidate || isInside(parent, candidate);
}

function runProcess(command, args, { capture, cwd, environment }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: environment,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    const stdout = [];
    const stderr = [];
    if (capture) {
      child.stdout.on("data", (chunk) => stdout.push(chunk));
      child.stderr.on("data", (chunk) => stderr.push(chunk));
    }
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const result = {
        code,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      };
      if (code === 0) {
        resolve(result);
        return;
      }
      const detail = `${result.stderr}${result.stdout}`.trim();
      reject(
        new Error(
          detail ||
            `Command failed (${signal ?? code ?? "unknown"}): ${command} ${args.join(" ")}`,
        ),
      );
    });
  });
}

if (import.meta.main) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      printHelp();
    } else {
      const result = await buildServerArtifact({
        packageName: options.packageName,
      });
      console.log(
        `Built ${result.packageName} server artifact: ${result.artifactEntries} entries, ${result.artifactBytes} bytes.`,
      );
    }
  } catch (error) {
    console.error(
      `cx-server-artifact: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
