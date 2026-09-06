#!/usr/bin/env node

import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseWorkspaceContract } from "./workspace-contract.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultSchemaPath = path.join(
  packageRoot,
  "platform",
  "cx-product.schema.json",
);
const defaultStandardPath = path.join(
  packageRoot,
  "platform",
  "web-standard.json",
);
const canonicalFrameworkSpec = "github:mikaelcedergren/cx-framework#main";
const frameworkPackageName = "@mikaelcedergren/cx-framework";
// Keep the source identity assembled so the package exporter cannot rewrite it
// while replacing published framework imports in the generated package.
const sourceFrameworkPackageName = ["@cortex", "framework"].join("/");
const sourceFrameworkSpec = "workspace:*";
const dependencySectionNames = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export async function checkProduct({
  root = process.cwd(),
  schemaPath = defaultSchemaPath,
  standardPath = defaultStandardPath,
} = {}) {
  const projectRoot = await realpath(path.resolve(root));
  const workspaceManifest = await readWorkspaceManifest(projectRoot);
  const [
    manifest,
    schema,
    standard,
    frameworkPackage,
    packageJson,
    packageJsons,
    nodeVersion,
  ] = await Promise.all([
    readJson(path.join(projectRoot, "cx-product.json"), "product manifest"),
    readJson(schemaPath, "product schema"),
    readJson(standardPath, "web standard"),
    readJson(path.join(packageRoot, "package.json"), "framework package"),
    readJson(path.join(projectRoot, "package.json"), "root package"),
    collectPackageJsons(projectRoot, workspaceManifest),
    readText(path.join(projectRoot, ".nvmrc"), ".nvmrc"),
  ]);

  const issues = validateSchema(manifest, schema);
  validateSemantics(manifest, issues);
  validateToolchain({
    frameworkPackage,
    manifest,
    packageJson,
    packageJsons,
    nodeVersion,
    standard,
    workspaceManifest,
    issues,
  });

  return { issues, manifest, projectRoot, standard };
}

export function validateSchema(value, schema, location = "$") {
  const issues = [];
  visit(value, schema, location, issues);
  return issues;
}

function visit(value, schema, location, issues) {
  if (Object.hasOwn(schema, "const") && value !== schema.const) {
    issues.push(`${location} must equal ${JSON.stringify(schema.const)}.`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    issues.push(`${location} must be one of: ${schema.enum.join(", ")}.`);
    return;
  }

  if (schema.type === "object") {
    if (!isRecord(value)) {
      issues.push(`${location} must be an object.`);
      return;
    }
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key))
        issues.push(`${location}.${key} is required.`);
    }
    const allowed = new Set(Object.keys(schema.properties ?? {}));
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!allowed.has(key))
          issues.push(`${location}.${key} is not allowed.`);
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key))
        visit(value[key], childSchema, `${location}.${key}`, issues);
    }
    return;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      issues.push(`${location} must be an array.`);
      return;
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) {
        issues.push(`${location} must not contain duplicate values.`);
      }
    }
    for (let index = 0; index < value.length; index += 1) {
      visit(value[index], schema.items ?? {}, `${location}[${index}]`, issues);
    }
    return;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      issues.push(`${location} must be a string.`);
      return;
    }
    if (schema.minLength && value.length < schema.minLength) {
      issues.push(
        `${location} must contain at least ${schema.minLength} character(s).`,
      );
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      issues.push(`${location} must match ${schema.pattern}.`);
    }
  }
}

function validateSemantics(manifest, issues) {
  if (!isRecord(manifest)) return;
  const frontend = isRecord(manifest.frontend) ? manifest.frontend : {};
  const capabilities = isRecord(manifest.capabilities)
    ? manifest.capabilities
    : {};

  if (manifest.profile === "static-site") {
    if (frontend.rendering !== "ssg") {
      issues.push(
        "$.frontend.rendering must be ssg for a static-site profile.",
      );
    }
    if (capabilities.authentication !== "none") {
      issues.push(
        "$.capabilities.authentication must be none for a static-site profile.",
      );
    }
    if (capabilities.persistentData !== "none") {
      issues.push(
        "$.capabilities.persistentData must be none for a static-site profile.",
      );
    }
    if (!["none", "build-time"].includes(capabilities.backgroundWork)) {
      issues.push(
        "$.capabilities.backgroundWork must be none or build-time for a static-site profile.",
      );
    }
  }

  if (
    frontend.designSystem === "cx-framework-source" &&
    manifest.id !== "cortex"
  ) {
    issues.push(
      "Only Cortex may declare cx-framework-source as its design system.",
    );
  }
  if (
    frontend.visualSystem === "product-skin" &&
    manifest.id !== "faunapoolen"
  ) {
    issues.push(
      "Only Faunapoolen has an approved product-skin visual exception.",
    );
  }
  if (manifest.deployment === "work-mac" && manifest.id !== "foundry") {
    issues.push(
      "Only Foundry currently has an approved work-mac deployment boundary.",
    );
  }
}

function validateToolchain({
  frameworkPackage,
  manifest,
  packageJson,
  packageJsons,
  nodeVersion,
  standard,
  workspaceManifest,
  issues,
}) {
  if (!isRecord(packageJson) || !isRecord(standard?.toolchain)) return;
  const toolchain = standard.toolchain;
  if (nodeVersion.trim() !== String(toolchain.nodeMajor)) {
    issues.push(`.nvmrc must contain ${toolchain.nodeMajor}.`);
  }
  if (packageJson.packageManager !== toolchain.packageManager) {
    issues.push(`packageManager must be ${toolchain.packageManager}.`);
  }
  if (packageJson.engines?.node !== toolchain.nodeEngine) {
    issues.push(`engines.node must be ${toolchain.nodeEngine}.`);
  }

  for (const { relativePath, value } of packageJsons) {
    if (value.engines?.node && value.engines.node !== toolchain.nodeEngine) {
      issues.push(
        `${relativePath} engines.node must be ${toolchain.nodeEngine}.`,
      );
    }
    if (value.pnpm !== undefined) {
      issues.push(
        `${relativePath} must not declare package.json#pnpm settings; pnpm 11 reads product configuration only from pnpm-workspace.yaml.`,
      );
    }
  }
  const frameworkBuildMatchers = Object.entries(
    workspaceManifest?.allowBuilds ?? {},
  )
    .filter(
      ([matcher, allowed]) =>
        allowed === true &&
        allowBuildMatcherTargetsPackage(matcher, frameworkPackageName),
    )
    .map(([matcher]) => matcher);
  if (frameworkBuildMatchers.length > 0) {
    issues.push(
      `pnpm-workspace.yaml must not allow ${frameworkPackageName} in allowBuilds; matched by ${frameworkBuildMatchers.map((matcher) => JSON.stringify(matcher)).join(", ")}. The published package ships immutable built output and runs no install lifecycle.`,
    );
  }
  if (workspaceManifest?.dangerouslyAllowAllBuilds === true) {
    issues.push(
      "pnpm-workspace.yaml must not set dangerouslyAllowAllBuilds: true.",
    );
  }
  if (workspaceManifest?.enableGlobalVirtualStore !== false) {
    issues.push(
      "pnpm-workspace.yaml must set enableGlobalVirtualStore: false.",
    );
  }
  if (workspaceManifest?.strictDepBuilds !== true) {
    issues.push("pnpm-workspace.yaml must set strictDepBuilds: true.");
  }
  if (workspaceManifest?.strictStorePkgContentCheck !== true) {
    issues.push(
      "pnpm-workspace.yaml must set strictStorePkgContentCheck: true.",
    );
  }
  if (workspaceManifest?.verifyDepsBeforeRun !== "error") {
    issues.push("pnpm-workspace.yaml must set verifyDepsBeforeRun: error.");
  }
  if (workspaceManifest?.verifyStoreIntegrity !== true) {
    issues.push("pnpm-workspace.yaml must set verifyStoreIntegrity: true.");
  }

  for (const script of standard.requiredScripts ?? []) {
    const command = packageJson.scripts?.[script];
    if (typeof command !== "string" || !command.trim()) {
      issues.push(`package.json must define the canonical ${script} script.`);
    } else if (isPlaceholderScript(command)) {
      issues.push(
        `package.json canonical ${script} must execute a real verification or runtime command, not a placeholder.`,
      );
    }
  }
  if (
    manifest?.deployment !== "work-mac" &&
    packageJson.scripts?.e2e !== "node scripts/run-e2e.mjs"
  ) {
    issues.push(
      "package.json canonical e2e must enter through node scripts/run-e2e.mjs so the framework can own isolation and cleanup.",
    );
  }
  if (
    typeof packageJson.scripts?.["build:server:release"] !== "string" ||
    !packageJson.scripts["build:server:release"].trim()
  ) {
    issues.push(
      "package.json must define the canonical build:server:release script.",
    );
  }
  const localPnpmVersion =
    typeof toolchain.packageManager === "string"
      ? toolchain.packageManager.match(/^pnpm@([^+]+)\+sha512\./u)?.[1]
      : undefined;
  if (!localPnpmVersion) {
    issues.push(
      "The web standard packageManager must be an integrity-qualified pnpm locator.",
    );
  } else if (packageJson.devDependencies?.pnpm !== localPnpmVersion) {
    issues.push(
      `Root devDependencies.pnpm must be exactly ${localPnpmVersion} so server artifacts use the repository-contained package-manager CLI.`,
    );
  }

  const dependencyDeclarations = packageJsons.flatMap(
    ({ relativePath, value }) =>
      dependencySectionNames.flatMap((section) =>
        Object.entries(value[section] ?? {}).map(([name, declared]) => ({
          declared,
          name,
          relativePath,
          section,
        })),
      ),
  );
  validatePortableDependencyBoundaries(
    packageJsons,
    manifest,
    dependencyDeclarations,
    issues,
  );
  validateProductionArchitecture({
    manifest,
    packageJson,
    packageJsons,
    issues,
  });

  const angularDeclarations = dependencyDeclarations.filter(({ name }) =>
    name.startsWith("@angular/"),
  );
  if (angularDeclarations.length === 0) {
    issues.push(
      "An Angular web product must declare at least one @angular/* package.",
    );
  }
  for (const declaration of angularDeclarations) {
    if (declaredMajor(declaration.declared) !== toolchain.angularMajor) {
      issues.push(
        `${declaration.relativePath} ${declaration.name} must use Angular major ${toolchain.angularMajor}.`,
      );
    }
  }

  const typescriptDeclarations = dependencyDeclarations.filter(
    ({ name }) => name === "typescript",
  );
  if (typescriptDeclarations.length === 0) {
    issues.push("An Angular web product must declare TypeScript.");
  }
  for (const declaration of typescriptDeclarations) {
    if (declaration.declared !== toolchain.typescript) {
      issues.push(
        `${declaration.relativePath} TypeScript must be ${toolchain.typescript}.`,
      );
    }
  }

  const nodeTypeDeclarations = dependencyDeclarations.filter(
    ({ name }) => name === "@types/node",
  );
  for (const declaration of nodeTypeDeclarations) {
    if (declaration.declared !== toolchain.nodeTypes) {
      issues.push(
        `${declaration.relativePath} @types/node must be ${toolchain.nodeTypes}.`,
      );
    }
  }

  const playwrightDeclarations = dependencyDeclarations.filter(
    ({ name }) => name === "@playwright/test" || name === "playwright",
  );
  if (playwrightDeclarations.length === 0) {
    issues.push(
      "A web product must declare Playwright for its canonical e2e command.",
    );
  }
  for (const declaration of playwrightDeclarations) {
    if (declaration.declared !== toolchain.playwright) {
      issues.push(
        `${declaration.relativePath} ${declaration.name} must be ${toolchain.playwright}.`,
      );
    }
  }

  const frameworkContract =
    manifest?.frontend?.designSystem === "cx-framework"
      ? {
          name: frameworkPackageName,
          spec: canonicalFrameworkSpec,
        }
      : manifest?.frontend?.designSystem === "cx-framework-source"
        ? {
            name: sourceFrameworkPackageName,
            spec: sourceFrameworkSpec,
          }
        : null;
  if (frameworkContract) {
    const declarations = packageJsons.flatMap(({ relativePath, value }) => {
      return dependencySectionNames.flatMap((section) => {
        const declared = value[section]?.[frameworkContract.name];
        return declared ? [{ declared, relativePath, section }] : [];
      });
    });
    if (declarations.length === 0) {
      issues.push(
        `A workspace package must declare ${frameworkContract.name}.`,
      );
    }
    for (const declaration of declarations) {
      if (declaration.declared !== frameworkContract.spec) {
        issues.push(
          `${declaration.relativePath} must use ${frameworkContract.spec} for ${frameworkContract.name}.`,
        );
      }
    }
    if (
      frameworkContract.name === frameworkPackageName &&
      packageJson.scripts?.e2e === "node scripts/run-e2e.mjs" &&
      !dependencySectionNames.some(
        (section) =>
          packageJson[section]?.[frameworkContract.name] ===
          frameworkContract.spec,
      )
    ) {
      issues.push(
        `package.json must declare ${frameworkContract.name} as ${frameworkContract.spec} because the root E2E entrypoint imports the shared runner directly.`,
      );
    }

    const browserPackages = packageJsons.filter(({ value }) =>
      Object.keys(value.dependencies ?? {}).some((name) =>
        name.startsWith("@angular/"),
      ),
    );
    if (browserPackages.length === 0) {
      issues.push(
        "An Angular browser workspace must declare its runtime dependencies directly.",
      );
    }
    const browserPeers = Object.entries(
      frameworkPackage.peerDependencies ?? {},
    ).sort(([left], [right]) => left.localeCompare(right));
    const browserPeerNames = browserPeers.map(([name]) => name);
    for (const { relativePath, value } of browserPackages) {
      if (
        value.dependencies?.[frameworkContract.name] !== frameworkContract.spec
      ) {
        issues.push(
          `${relativePath} must declare ${frameworkContract.name} directly in dependencies for its Angular browser runtime.`,
        );
      }
      for (const [peerName, peerRange] of browserPeers) {
        const declared = value.dependencies?.[peerName];
        if (typeof declared !== "string") {
          issues.push(
            `${relativePath} must declare browser runtime peer ${peerName} directly in dependencies; Node-only workspaces must leave it absent.`,
          );
          continue;
        }
        const requiredVersion = parseSupportedVersionRange(peerRange);
        const declaredVersion = parseSupportedVersionRange(declared);
        if (!requiredVersion) {
          issues.push(
            `cx-framework peer ${peerName} has unsupported version contract ${JSON.stringify(peerRange)}.`,
          );
          continue;
        }
        if (!declaredVersion) {
          issues.push(
            `${relativePath} ${peerName} must use an exact, caret, or tilde x.y.z range compatible with cx-framework ${peerRange}.`,
          );
          continue;
        }
        if (
          declaredVersion.major !== requiredVersion.major ||
          compareVersions(declaredVersion, requiredVersion) < 0
        ) {
          issues.push(
            `${relativePath} ${peerName} must use major ${requiredVersion.major} at or above the cx-framework floor ${requiredVersion.major}.${requiredVersion.minor}.${requiredVersion.patch}.`,
          );
        }
      }
    }

    let hasNodeOnlyFrameworkConsumer = false;
    for (const { relativePath, value } of packageJsons) {
      const declaresSelectedFramework = dependencySectionNames.some(
        (section) =>
          typeof value[section]?.[frameworkContract.name] === "string",
      );
      if (!declaresSelectedFramework) continue;

      const isBrowser = browserPackages.some(
        (candidate) => candidate.relativePath === relativePath,
      );
      const isFrameworkAuthor =
        manifest.frontend.designSystem === "cx-framework-source" &&
        value.name === sourceFrameworkPackageName;
      if (isBrowser || isFrameworkAuthor) continue;
      hasNodeOnlyFrameworkConsumer = true;

      for (const section of dependencySectionNames) {
        for (const peerName of browserPeerNames) {
          if (typeof value[section]?.[peerName] === "string") {
            issues.push(
              `${relativePath} is a Node-only ${frameworkContract.name} consumer and must not declare browser peer ${peerName} in ${section}.`,
            );
          }
        }
      }
    }
    if (
      hasNodeOnlyFrameworkConsumer &&
      workspaceManifest?.resolvePeersFromWorkspaceRoot !== false
    ) {
      issues.push(
        `pnpm-workspace.yaml must set resolvePeersFromWorkspaceRoot: false when a Node-only workspace consumes ${frameworkContract.name}.`,
      );
    }
    if (
      hasNodeOnlyFrameworkConsumer &&
      workspaceManifest?.dedupePeerDependents !== false
    ) {
      issues.push(
        `pnpm-workspace.yaml must set dedupePeerDependents: false when a Node-only workspace consumes ${frameworkContract.name}, so browser peer dependencies cannot enter the server deployment closure.`,
      );
    }
    if (
      hasNodeOnlyFrameworkConsumer &&
      workspaceManifest?.autoInstallPeers !== false
    ) {
      issues.push(
        `pnpm-workspace.yaml must set autoInstallPeers: false when a Node-only workspace consumes ${frameworkContract.name}, so pnpm cannot synthesize optional browser peer dependencies for the server.`,
      );
    }
  }
}

function validatePortableDependencyBoundaries(
  packageJsons,
  manifest,
  declarations,
  issues,
) {
  const isFrameworkSource =
    manifest?.frontend?.designSystem === "cx-framework-source" &&
    manifest?.id === "cortex";
  for (const declaration of declarations) {
    const spec = declaration.declared;
    if (typeof spec !== "string") continue;
    if (isLocalFilesystemDependencySpecifier(spec)) {
      issues.push(
        `${declaration.relativePath} ${declaration.section}.${declaration.name} must not use a local filesystem dependency; use an owned workspace package or the published framework contract.`,
      );
    }
    if (
      /(?:^|[/@-])server-ops(?:$|[/@-])/iu.test(declaration.name) ||
      /(?:^|[/])server-ops(?:[/#@]|$)/iu.test(spec)
    ) {
      issues.push(
        `${declaration.relativePath} must not depend on server-ops portable runtime code.`,
      );
    }
    if (declaration.name === sourceFrameworkPackageName && !isFrameworkSource) {
      issues.push(
        `${declaration.relativePath} may use ${sourceFrameworkPackageName} only inside Cortex's framework-source workspace.`,
      );
    }
  }

  for (const { relativePath, value } of packageJsons) {
    for (const field of ["overrides", "resolutions"]) {
      for (const spec of collectStringLeaves(value[field])) {
        if (isLocalFilesystemDependencySpecifier(spec)) {
          issues.push(
            `${relativePath} ${field} must not redirect packages to local filesystem paths.`,
          );
          break;
        }
      }
    }
  }
}

function isLocalFilesystemDependencySpecifier(value) {
  const spec = value.trim();
  return (
    /^(?:file|git\+file|link):/iu.test(spec) ||
    /^(?:\.{1,2})(?:[\\/]|$)/u.test(spec) ||
    path.posix.isAbsolute(spec) ||
    path.win32.isAbsolute(spec)
  );
}

function validateProductionArchitecture({
  manifest,
  packageJson,
  packageJsons,
  issues,
}) {
  const serverPackage = packageJsons.find(
    ({ relativePath, value }) =>
      relativePath === "server/package.json" ||
      path.posix.basename(path.posix.dirname(relativePath)) === "server" ||
      (typeof value.name === "string" && value.name.endsWith("-server")),
  );
  if (!serverPackage) {
    issues.push(
      "A web product must declare one explicit server workspace package.",
    );
    return;
  }

  const server = serverPackage.value;
  if (server.type !== "module") {
    issues.push(`${serverPackage.relativePath} type must be module.`);
  }
  if (
    !Array.isArray(server.files) ||
    !server.files.some((entry) => entry === "dist" || entry === "dist/")
  ) {
    issues.push(
      `${serverPackage.relativePath} files must explicitly include dist/.`,
    );
  }
  if (
    typeof server.scripts?.build !== "string" ||
    !server.scripts.build.trim()
  ) {
    issues.push(
      `${serverPackage.relativePath} must define a compiled server build.`,
    );
  }

  const productionScripts = Object.entries(server.scripts ?? {}).filter(
    ([name]) => name === "start" || name.startsWith("start:"),
  );
  if (productionScripts.length === 0) {
    issues.push(
      `${serverPackage.relativePath} must define a compiled production start command.`,
    );
  }
  for (const [name, command] of productionScripts) {
    if (typeof command !== "string" || !command.trim()) continue;
    if (usesTypeScriptOrDevelopmentRunner(command)) {
      issues.push(
        `${serverPackage.relativePath} ${name} must run compiled JavaScript, never a TypeScript or development runner.`,
      );
    }
  }
  if (
    !productionScripts.some(
      ([, command]) =>
        typeof command === "string" &&
        /(?:^|[;&|]\s*|\s)node\s+[^\n;&|]*\bdist\/[A-Za-z0-9._/-]+\.js(?:\s|$)/u.test(
          command,
        ),
    )
  ) {
    issues.push(
      `${serverPackage.relativePath} must expose a production command that starts compiled dist/*.js with Node.`,
    );
  }

  const frameworkContract =
    manifest?.frontend?.designSystem === "cx-framework-source"
      ? [sourceFrameworkPackageName, sourceFrameworkSpec]
      : [frameworkPackageName, canonicalFrameworkSpec];
  if (server.dependencies?.[frameworkContract[0]] !== frameworkContract[1]) {
    issues.push(
      `${serverPackage.relativePath} must declare ${frameworkContract[0]} directly in dependencies as ${frameworkContract[1]}.`,
    );
  }

  const rootStart = packageJson.scripts?.start;
  if (
    typeof rootStart === "string" &&
    usesTypeScriptOrDevelopmentRunner(rootStart)
  ) {
    issues.push(
      "package.json start must not use tsx, ts-node, ng serve, Vite, or another development runner.",
    );
  }

  const capabilities = isRecord(manifest?.capabilities)
    ? manifest.capabilities
    : {};
  if (capabilities.backgroundWork === "durable") {
    const worker = server.scripts?.["start:worker"];
    if (
      typeof worker !== "string" ||
      usesTypeScriptOrDevelopmentRunner(worker) ||
      !/(?:^|[;&|]\s*|\s)node\s+[^\n;&|]*\bdist\/[A-Za-z0-9._/-]+\.js(?:\s|$)/u.test(
        worker,
      )
    ) {
      issues.push(
        `${serverPackage.relativePath} must define start:worker as a compiled Node entrypoint when backgroundWork is durable.`,
      );
    }
  }
  if (
    Array.isArray(capabilities.externalEffects) &&
    capabilities.externalEffects.length > 0 &&
    capabilities.backgroundWork !== "durable"
  ) {
    issues.push(
      "Runtime externalEffects require durable backgroundWork so paid or retryable work is not owned by the HTTP process.",
    );
  }
}

function usesTypeScriptOrDevelopmentRunner(command) {
  return /(?:^|[\s;&|/])(?:tsx|ts-node|webpack-dev-server)(?=$|[\s;&|])|\bng\s+serve\b|(?:^|[\s;&|])vite(?:\s|$)/iu.test(
    command,
  );
}

function isPlaceholderScript(command) {
  return /^(?:echo(?:\s|$)|true$|:\s*$)/u.test(command.trim());
}

function collectStringLeaves(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringLeaves);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectStringLeaves);
}

export function allowBuildMatcherTargetsPackage(matcher, packageName) {
  if (typeof matcher !== "string" || typeof packageName !== "string") {
    return false;
  }
  if (matcher === packageName || matcher.startsWith(`${packageName}@`)) {
    return true;
  }
  if (wildcardMatches(matcher, packageName)) return true;
  const namePattern = dependencySelectorName(matcher);
  return namePattern !== matcher && wildcardMatches(namePattern, packageName);
}

function dependencySelectorName(matcher) {
  if (matcher.startsWith("@")) {
    const slash = matcher.indexOf("/");
    if (slash === -1) return matcher;
    const separator = matcher.indexOf("@", slash + 1);
    return separator === -1 ? matcher : matcher.slice(0, separator);
  }
  const separator = matcher.indexOf("@");
  return separator === -1 ? matcher : matcher.slice(0, separator);
}

function wildcardMatches(pattern, value) {
  let patternIndex = 0;
  let valueIndex = 0;
  let starIndex = -1;
  let starValueIndex = -1;
  while (valueIndex < value.length) {
    if (
      patternIndex < pattern.length &&
      (pattern[patternIndex] === "?" ||
        pattern[patternIndex] === value[valueIndex])
    ) {
      patternIndex += 1;
      valueIndex += 1;
      continue;
    }
    if (patternIndex < pattern.length && pattern[patternIndex] === "*") {
      starIndex = patternIndex;
      starValueIndex = valueIndex;
      patternIndex += 1;
      continue;
    }
    if (starIndex !== -1) {
      patternIndex = starIndex + 1;
      starValueIndex += 1;
      valueIndex = starValueIndex;
      continue;
    }
    return false;
  }
  while (patternIndex < pattern.length && pattern[patternIndex] === "*") {
    patternIndex += 1;
  }
  return patternIndex === pattern.length;
}

function parseSupportedVersionRange(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^[~^]?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(left, right) {
  for (const key of ["major", "minor", "patch"]) {
    const difference = left[key] - right[key];
    if (difference !== 0) return difference;
  }
  return 0;
}

function declaredMajor(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

async function readWorkspaceManifest(projectRoot) {
  const workspaceFile = path.join(projectRoot, "pnpm-workspace.yaml");
  let stats;
  try {
    stats = await lstat(workspaceFile);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error("pnpm-workspace.yaml must be a regular non-symlink file.");
  }
  return parseWorkspaceContract(await readFile(workspaceFile, "utf8"));
}

async function assertSafeWorkspaceDirectory(projectRoot, relativePath) {
  let cursor = projectRoot;
  for (const segment of relativePath.split("/")) {
    cursor = path.join(cursor, segment);
    const stats = await lstat(cursor);
    if (stats.isSymbolicLink()) {
      throw new Error(
        `Workspace package path ${relativePath} must not traverse symbolic links.`,
      );
    }
    if (!stats.isDirectory()) {
      throw new Error(
        `Workspace package path ${relativePath} is not a directory.`,
      );
    }
  }
  const canonical = await realpath(cursor);
  if (!isInside(projectRoot, canonical)) {
    throw new Error(
      `Workspace package path ${relativePath} escapes the product root.`,
    );
  }
  return canonical;
}

async function readRegularPackageJson(filePath, label) {
  const stats = await lstat(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`${label} must be a regular non-symlink file.`);
  }
  return readJson(filePath, label);
}

export async function collectPackageJsons(
  projectRoot,
  workspaceManifest = undefined,
) {
  const canonicalRoot = await realpath(projectRoot);
  const resolvedWorkspaceManifest =
    workspaceManifest === undefined
      ? await readWorkspaceManifest(canonicalRoot)
      : workspaceManifest;
  const packages = [
    {
      relativePath: "package.json",
      value: await readRegularPackageJson(
        path.join(canonicalRoot, "package.json"),
        "root package",
      ),
    },
  ];
  for (const workspacePath of resolvedWorkspaceManifest?.packagePaths ?? []) {
    const workspaceRoot = await assertSafeWorkspaceDirectory(
      canonicalRoot,
      workspacePath,
    );
    const relativePath = `${workspacePath}/package.json`;
    packages.push({
      relativePath,
      value: await readRegularPackageJson(
        path.join(workspaceRoot, "package.json"),
        relativePath,
      ),
    });
  }
  return packages;
}

async function readJson(filePath, label) {
  const source = await readText(filePath, label);
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function readText(filePath, label) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read ${label} at ${filePath}: ${error.message}`);
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseArgs(argv) {
  let root = process.cwd();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      if (!argv[index + 1]) throw new Error("--root requires a directory.");
      root = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--root=")) {
      root = arg.slice("--root=".length);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: cx-platform-check [--root <project>]");
      process.exit(0);
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return { root };
}

async function main() {
  const result = await checkProduct(parseArgs(process.argv.slice(2)));
  if (result.issues.length > 0) {
    console.error(`Web platform check failed for ${result.projectRoot}:`);
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Web platform check passed: ${result.manifest.id}`);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
