#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(scriptPath), "..");
const packageName = "@mikaelcedergren/cx-framework";
const maximumDistributionBytes = 128 * 1024 * 1024;
const maximumDistributionDepth = 64;
const maximumDistributionFiles = 10_000;
const forbiddenLifecycleScripts = [
  "install",
  "postinstall",
  "postpack",
  "preinstall",
  "prepack",
  "prepare",
  "prepublish",
  "prepublishOnly",
];

export async function snapshotBuiltDistribution(root) {
  const canonicalRoot = await realpath(path.resolve(root));
  const distributionRoot = path.join(canonicalRoot, "dist");
  const rootEntry = await safeLstat(distributionRoot, "Built distribution");
  if (rootEntry.isSymbolicLink() || !rootEntry.isDirectory()) {
    throw new Error(
      `Built distribution must be a regular directory: ${distributionRoot}`,
    );
  }

  const files = [];
  let totalBytes = 0;
  await visit(distributionRoot, 0);
  files.sort((left, right) => left.path.localeCompare(right.path));
  if (files.length === 0) {
    throw new Error("Built distribution contains no files.");
  }

  const fingerprint = createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex");
  return Object.freeze({
    bytes: totalBytes,
    files: Object.freeze(files),
    fingerprint,
    root: canonicalRoot,
  });

  async function visit(directory, depth) {
    if (depth > maximumDistributionDepth) {
      throw new Error(
        `Built distribution exceeds the ${maximumDistributionDepth}-level depth limit.`,
      );
    }
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const absolutePath = path.join(directory, child.name);
      const entry = await safeLstat(absolutePath, "Built distribution entry");
      if (entry.isSymbolicLink()) {
        throw new Error(
          `Built distribution must not contain symbolic links: ${absolutePath}`,
        );
      }
      if (entry.isDirectory()) {
        await visit(absolutePath, depth + 1);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(
          `Built distribution contains an unsupported filesystem entry: ${absolutePath}`,
        );
      }
      if (files.length >= maximumDistributionFiles) {
        throw new Error(
          `Built distribution exceeds the ${maximumDistributionFiles}-file limit.`,
        );
      }
      totalBytes += entry.size;
      if (totalBytes > maximumDistributionBytes) {
        throw new Error(
          `Built distribution exceeds the ${maximumDistributionBytes}-byte limit.`,
        );
      }
      const source = await readFile(absolutePath);
      files.push(
        Object.freeze({
          bytes: source.byteLength,
          executable: Boolean(entry.mode & 0o111),
          path: packageRelative(canonicalRoot, absolutePath),
          sha256: createHash("sha256").update(source).digest("hex"),
        }),
      );
    }
  }
}

export async function assertBuiltPackageDistribution({
  root = packageRoot,
  requireGitClean = false,
  verifyRuntime = false,
} = {}) {
  const canonicalRoot = await realpath(path.resolve(root));
  const manifest = parseJson(
    await readFile(path.join(canonicalRoot, "package.json"), "utf8"),
    "Package manifest",
  );
  if (manifest.name !== packageName) {
    throw new Error(`Built distribution belongs to ${packageName}.`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist/")) {
    throw new Error("Package files must include the checked-in dist/ tree.");
  }
  for (const script of forbiddenLifecycleScripts) {
    if (Object.hasOwn(manifest.scripts ?? {}, script)) {
      throw new Error(
        `Immutable package delivery forbids the ${script} lifecycle script.`,
      );
    }
  }
  if (manifest.pnpm !== undefined) {
    throw new Error(
      "Immutable package delivery must not carry package.json#pnpm configuration ignored by pnpm 11.",
    );
  }

  const snapshot = await snapshotBuiltDistribution(canonicalRoot);
  const distributedFiles = new Set(snapshot.files.map((entry) => entry.path));
  const exportedDistTargets = flattenExportTargets(manifest.exports).filter(
    (target) => target.startsWith("./dist/") && !target.includes("*"),
  );
  for (const target of exportedDistTargets) {
    const relativeTarget = target.slice(2);
    if (!distributedFiles.has(relativeTarget)) {
      throw new Error(
        `Package export points at missing checked-in output: ${target}`,
      );
    }
  }
  for (const required of [
    "dist/lib/public-api.d.ts",
    "dist/lib/public-api.js",
    "dist/server/index.d.ts",
    "dist/server/index.js",
  ]) {
    if (!distributedFiles.has(required)) {
      throw new Error(`Built distribution is missing ${required}.`);
    }
  }

  const gitignore = await readFile(
    path.join(canonicalRoot, ".gitignore"),
    "utf8",
  );
  if (
    gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .some((line) => line === "dist" || line === "dist/" || line === "/dist/")
  ) {
    throw new Error("Generated package .gitignore must not ignore dist/.");
  }

  if (verifyRuntime) {
    await import("@angular/compiler");
    await import(
      pathToFileURL(path.join(canonicalRoot, "dist", "lib", "public-api.js"))
    );
    await import(
      pathToFileURL(path.join(canonicalRoot, "dist", "server", "index.js"))
    );
  }
  if (requireGitClean) {
    assertGitTrackedDistribution(canonicalRoot, snapshot);
  }
  return snapshot;
}

export function assertBuiltDistributionUnchanged(before, after) {
  if (before.fingerprint === after.fingerprint) return;
  const beforeFiles = new Map(before.files.map((entry) => [entry.path, entry]));
  const afterFiles = new Map(after.files.map((entry) => [entry.path, entry]));
  const paths = [
    ...new Set([...beforeFiles.keys(), ...afterFiles.keys()]),
  ].sort((left, right) => left.localeCompare(right));
  const changed = paths.find(
    (file) =>
      JSON.stringify(beforeFiles.get(file)) !==
      JSON.stringify(afterFiles.get(file)),
  );
  throw new Error(
    `Rebuilding must leave checked-in dist byte-identical${changed ? `; changed: ${changed}` : ""}.`,
  );
}

export async function assertRebuildPreservesBuiltDistribution({
  root = packageRoot,
  requireGitClean = false,
  verifyRuntime = true,
} = {}) {
  const before = await assertBuiltPackageDistribution({
    root,
    requireGitClean,
    verifyRuntime,
  });
  const buildScript = path.join(before.root, "scripts", "build.mjs");
  const result = spawnSync(process.execPath, [buildScript], {
    cwd: before.root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `Could not rebuild the checked-in distribution:\n${result.stdout || ""}${result.stderr || ""}`,
    );
  }
  const after = await assertBuiltPackageDistribution({
    root: before.root,
    requireGitClean,
    verifyRuntime,
  });
  assertBuiltDistributionUnchanged(before, after);
  return Object.freeze({ before, after });
}

function assertGitTrackedDistribution(root, snapshot) {
  const gitRoot = runGit(root, ["rev-parse", "--show-toplevel"]).trim();
  if (path.resolve(gitRoot) !== root) {
    throw new Error(
      "Built distribution check must run at the generated package Git root.",
    );
  }
  const tracked = new Set(
    runGit(root, ["ls-files", "-z", "--", "dist"]).split("\0").filter(Boolean),
  );
  for (const file of snapshot.files) {
    if (!tracked.has(file.path)) {
      throw new Error(
        `Built distribution file is not tracked by Git: ${file.path}`,
      );
    }
  }
  if (tracked.size !== snapshot.files.length) {
    throw new Error(
      "Git tracks a dist entry that is missing from the built distribution.",
    );
  }
  const status = runGit(root, [
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--",
    "dist",
  ]);
  if (status) {
    throw new Error(
      "Checked-in dist differs from Git; rebuild and export it from Cortex.",
    );
  }
}

function runGit(root, arguments_) {
  const result = spawnSync("git", ["-C", root, ...arguments_], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `Could not verify the checked-in distribution with Git: ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

function flattenExportTargets(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.values(value).flatMap(flattenExportTargets);
}

function packageRelative(root, candidate) {
  const relative = path.relative(root, candidate);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `Built distribution path escapes its package: ${candidate}`,
    );
  }
  return relative.split(path.sep).join("/");
}

async function safeLstat(candidate, label) {
  try {
    return await lstat(candidate);
  } catch (error) {
    throw new Error(`${label} is missing or unreadable: ${candidate}`, {
      cause: error,
    });
  }
}

function parseJson(source, label) {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
}

function parseCliArgs(argv) {
  const options = { rebuild: false, requireGitClean: false };
  for (const argument of argv) {
    if (argument === "--") continue;
    if (argument === "--git") {
      options.requireGitClean = true;
      continue;
    }
    if (argument === "--rebuild") {
      options.rebuild = true;
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  if (options.rebuild) {
    const { before } = await assertRebuildPreservesBuiltDistribution({
      requireGitClean: options.requireGitClean,
      verifyRuntime: true,
    });
    console.log(
      `Verified byte-identical rebuild: ${before.files.length} files, ${before.bytes} bytes, ${before.fingerprint}`,
    );
    return;
  }
  const snapshot = await assertBuiltPackageDistribution({
    requireGitClean: options.requireGitClean,
    verifyRuntime: true,
  });
  console.log(
    `Verified built dist: ${snapshot.files.length} files, ${snapshot.bytes} bytes, ${snapshot.fingerprint}`,
  );
}

if (import.meta.main) {
  main()
    .then(() => undefined)
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
