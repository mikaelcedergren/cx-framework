const SAFE_PATH_PART_PATTERN = /^[a-z0-9._-]+$/i;
const FORBIDDEN_PACKAGE_PATH_SEGMENTS = new Set([
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out-tsc",
]);

export function parseWorkspaceContract(
  source,
  { allowRootPackageOnly = false } = {},
) {
  if (typeof source !== "string") {
    throw new Error("pnpm-workspace.yaml source must be text.");
  }
  if (source.includes("\t")) {
    throw new Error("pnpm-workspace.yaml must not contain tabs.");
  }

  const lines = source.split(/\r?\n/);
  assertCanonicalTopLevelKeys(lines);
  assertNoLegacyBuildSettings(lines);
  assertCanonicalAllowBuildsSyntax(lines);
  const packagePaths = workspacePackagePaths(lines, { allowRootPackageOnly });
  return Object.freeze({
    allowBuilds: booleanMapSetting(lines, "allowBuilds"),
    autoInstallPeers: optionalBooleanSetting(lines, "autoInstallPeers"),
    dangerouslyAllowAllBuilds: optionalBooleanSetting(
      lines,
      "dangerouslyAllowAllBuilds",
    ),
    dedupePeerDependents: optionalBooleanSetting(lines, "dedupePeerDependents"),
    enableGlobalVirtualStore: optionalBooleanSetting(
      lines,
      "enableGlobalVirtualStore",
    ),
    injectWorkspacePackages: optionalBooleanSetting(
      lines,
      "injectWorkspacePackages",
    ),
    packagePaths: Object.freeze(packagePaths),
    resolvePeersFromWorkspaceRoot: optionalBooleanSetting(
      lines,
      "resolvePeersFromWorkspaceRoot",
    ),
    strictStorePkgContentCheck: optionalBooleanSetting(
      lines,
      "strictStorePkgContentCheck",
    ),
    strictDepBuilds: optionalBooleanSetting(lines, "strictDepBuilds"),
    syncInjectedDepsAfterScripts: topLevelScalar(
      lines,
      "syncInjectedDepsAfterScripts",
    ),
    verifyDepsBeforeRun: optionalPlainScalarSetting(
      lines,
      "verifyDepsBeforeRun",
    ),
    verifyStoreIntegrity: optionalBooleanSetting(lines, "verifyStoreIntegrity"),
  });
}

function assertCanonicalTopLevelKeys(lines) {
  for (const line of lines) {
    const source = stripYamlComment(line).trimEnd();
    if (!source || /^\s/.test(source)) continue;
    if (
      source.startsWith("?") ||
      source.startsWith('"') ||
      source.startsWith("'")
    ) {
      throw new Error(
        "pnpm-workspace.yaml top-level keys must use canonical unquoted simple mapping syntax.",
      );
    }
  }
}

function assertCanonicalAllowBuildsSyntax(lines) {
  for (const line of lines) {
    const source = stripYamlComment(line).trimEnd();
    if (!source.trim()) continue;
    if (/^\s*(?:allowBuilds|["']allowBuilds["'])\s*:/.test(source)) {
      if (source !== "allowBuilds:") {
        throw new Error(
          "pnpm-workspace.yaml allowBuilds must be one unquoted top-level map without anchors or aliases.",
        );
      }
    }
    const syntax = unquotedYamlSyntax(source);
    if (
      /^\s*<<\s*:/.test(syntax) ||
      /(^|[\s:[,{])[&*][A-Za-z0-9_-]+(?=$|[\s,\]}])/.test(syntax)
    ) {
      throw new Error(
        "pnpm-workspace.yaml must not use YAML merges, anchors, or aliases for allowBuilds configuration.",
      );
    }
  }
}

function unquotedYamlSyntax(source) {
  let quote;
  let result = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote === '"' && character === "\\") {
      result += "  ";
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = quote === character ? undefined : (quote ?? character);
      result += " ";
      continue;
    }
    result += quote ? " " : character;
  }
  return result;
}

function assertNoLegacyBuildSettings(lines) {
  const legacySettings = new Set([
    "ignoreDepScripts",
    "ignoredBuiltDependencies",
    "neverBuiltDependencies",
    "onlyBuiltDependencies",
    "onlyBuiltDependenciesFile",
  ]);
  for (const line of lines) {
    const match = stripYamlComment(line).match(/^([A-Za-z][A-Za-z0-9]*):/);
    if (match && legacySettings.has(match[1])) {
      throw new Error(
        `pnpm-workspace.yaml ${match[1]} was removed in pnpm 11; use one explicit allowBuilds map.`,
      );
    }
  }
}

function booleanMapSetting(lines, key) {
  const starts = lines
    .map((line, index) => ({ index, line: stripYamlComment(line).trimEnd() }))
    .filter(({ line }) => line === `${key}:`);
  if (starts.length === 0) return undefined;
  if (starts.length !== 1) {
    throw new Error(`pnpm-workspace.yaml must contain at most one ${key} map.`);
  }

  const entries = Object.create(null);
  for (let index = starts[0].index + 1; index < lines.length; index += 1) {
    const line = stripYamlComment(lines[index]).trimEnd();
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) break;
    const match = line.match(/^  (.+?):\s+(true|false)$/);
    if (!match) {
      throw new Error(
        `pnpm-workspace.yaml ${key} must be an exact two-space-indented boolean map.`,
      );
    }
    const name = yamlScalar(match[1]);
    if (!name || /[\u0000-\u001f\u007f]/.test(name)) {
      throw new Error(
        `pnpm-workspace.yaml ${key} contains an invalid package matcher.`,
      );
    }
    if (Object.hasOwn(entries, name)) {
      throw new Error(
        `pnpm-workspace.yaml ${key} contains duplicate matcher ${name}.`,
      );
    }
    entries[name] = match[2] === "true";
  }
  return Object.freeze(entries);
}

function workspacePackagePaths(lines, { allowRootPackageOnly }) {
  const starts = lines
    .map((line, index) => ({ index, line: stripYamlComment(line).trimEnd() }))
    .filter(({ line }) => line === "packages:");
  if (starts.length === 0 && allowRootPackageOnly) {
    return [];
  }
  if (starts.length !== 1) {
    throw new Error(
      "pnpm-workspace.yaml must contain exactly one packages list.",
    );
  }

  const packagePaths = [];
  const identities = new Set();
  for (let index = starts[0].index + 1; index < lines.length; index += 1) {
    const line = stripYamlComment(lines[index]).trimEnd();
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) break;
    const match = line.match(/^  -\s+(.+)$/);
    if (!match) {
      throw new Error(
        "pnpm-workspace.yaml packages must be an explicit two-space-indented list.",
      );
    }
    const packagePath = yamlScalar(match[1]);
    assertWorkspacePackagePath(packagePath);
    const identity = packagePath.toLowerCase();
    if (identities.has(identity)) {
      throw new Error(
        `pnpm-workspace.yaml contains duplicate package path ${packagePath}.`,
      );
    }
    identities.add(identity);
    packagePaths.push(packagePath);
  }
  if (packagePaths.length === 0) {
    throw new Error("pnpm-workspace.yaml packages must not be empty.");
  }
  return packagePaths;
}

function assertWorkspacePackagePath(value) {
  const segments = value.split("/");
  if (
    !value ||
    value === "." ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\\") ||
    segments.some(
      (segment) =>
        !SAFE_PATH_PART_PATTERN.test(segment) ||
        segment === "." ||
        segment === ".." ||
        segment.startsWith(".") ||
        FORBIDDEN_PACKAGE_PATH_SEGMENTS.has(segment.toLowerCase()),
    )
  ) {
    throw new Error(
      "pnpm-workspace.yaml package entries must be explicit safe relative paths without globs, hidden paths, or build output.",
    );
  }
}

function optionalBooleanSetting(lines, key) {
  const value = topLevelRawScalar(lines, key);
  if (value === undefined) return undefined;
  if (value !== "true" && value !== "false") {
    throw new Error(
      `pnpm-workspace.yaml ${key} must be the literal true or false.`,
    );
  }
  return value === "true";
}

function optionalPlainScalarSetting(lines, key) {
  const value = topLevelRawScalar(lines, key);
  if (value === undefined) return undefined;
  if (!/^[a-z][a-z0-9-]*$/u.test(value)) {
    throw new Error(
      `pnpm-workspace.yaml ${key} must be one unquoted lowercase literal.`,
    );
  }
  return value;
}

function topLevelScalar(lines, key) {
  const value = topLevelRawScalar(lines, key);
  return value === undefined ? undefined : yamlScalar(value);
}

function topLevelRawScalar(lines, key) {
  const pattern = new RegExp(`^${key}:\\s*(.*?)\\s*$`);
  const matches = lines
    .map((line) => stripYamlComment(line).match(pattern))
    .filter(Boolean);
  if (matches.length > 1) {
    throw new Error(
      `pnpm-workspace.yaml must contain at most one ${key} setting.`,
    );
  }
  return matches.length === 1 ? matches[0][1].trim() : undefined;
}

export function stripYamlComment(source) {
  let quote;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote === '"' && character === "\\") {
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = quote === character ? undefined : (quote ?? character);
      continue;
    }
    if (character === "#" && quote === undefined) {
      return source.slice(0, index);
    }
  }
  return source;
}

export function yamlScalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string") return parsed;
    } catch {
      // The canonical scalar error below is clearer than JSON's parser detail.
    }
    throw new Error(`Invalid double-quoted YAML scalar: ${value}`);
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      throw new Error(`Invalid single-quoted YAML scalar: ${value}`);
    }
    return value.slice(1, -1).replaceAll("''", "'");
  }
  return value;
}
