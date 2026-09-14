#!/usr/bin/env node
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

export const DEVELOPMENT_FAVICON_COLOR = "#ff980a";

const CONFIG_NAME = "cx-development-favicon.json";
const MAX_CONFIG_BYTES = 16 * 1024;
const MAX_INDEX_BYTES = 512 * 1024;
const MAX_ICON_BYTES = 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CONFIG_KEYS = new Set(["icons", "index"]);
const INDEX_KEYS = new Set(["development", "production"]);
const ICON_KEYS = new Set(["source", "file", "href", "media"]);

function printHelp() {
  console.log(`Generate one consistent development favicon for Safari and Chromium browsers.

Usage:
  cx-development-favicon
  cx-development-favicon --apply
  cx-development-favicon --root /path/to/site
  cx-development-favicon --config path/to/config.json

Options:
  --apply          Write the badged favicons and development index.
  --config <path>  Config path relative to the site root. Defaults to ${CONFIG_NAME}.
  --root <path>    Site repository root. Defaults to the current directory.
  --help           Show this help.

Without --apply the command is read-only and fails when generated files are missing or stale.
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    configPath: CONFIG_NAME,
    root: process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      return null;
    }
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--root" || arg === "--config") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }
      if (arg === "--root") {
        options.root = value;
      } else {
        options.configPath = value;
      }
      index += 1;
      continue;
    }
    if (arg.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
      continue;
    }
    if (arg.startsWith("--config=")) {
      options.configPath = arg.slice("--config=".length);
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

async function statsOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value;
}

function assertExactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label} contains unknown key ${JSON.stringify(key)}.`);
    }
  }
}

function requireString(value, label) {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0
  ) {
    throw new Error(
      `${label} must be a non-empty string without surrounding whitespace.`,
    );
  }
  return value;
}

function requireRelativePath(value, label) {
  const relativePath = requireString(value, label);
  if (path.isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new Error(`${label} must be a relative filesystem path.`);
  }
  return relativePath;
}

function requireHref(value, label) {
  const href = requireString(value, label);
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    /[\s"'<>?#]/u.test(href)
  ) {
    throw new Error(
      `${label} must be one root-relative URL path without a query or fragment.`,
    );
  }
  return href;
}

export function parseDevelopmentFaviconConfig(value) {
  const config = assertPlainObject(value, "Development favicon config");
  assertExactKeys(config, CONFIG_KEYS, "Development favicon config");
  const index =
    config.index === undefined
      ? null
      : assertPlainObject(config.index, "index");
  if (index) assertExactKeys(index, INDEX_KEYS, "index");
  if (
    !Array.isArray(config.icons) ||
    config.icons.length < 1 ||
    config.icons.length > 16
  ) {
    throw new Error(
      "icons must contain between 1 and 16 production favicon variants.",
    );
  }
  const icons = config.icons.map((value, i) => {
    const label = `icons[${i}]`;
    const icon = assertPlainObject(value, label);
    assertExactKeys(icon, ICON_KEYS, label);
    const source = requireRelativePath(icon.source, `${label}.source`);
    const extension = path.extname(source).toLowerCase();
    if (extension !== ".png" && extension !== ".svg") {
      throw new Error(`${label}.source must end in .png or .svg.`);
    }
    const file = requireRelativePath(icon.file, `${label}.file`);
    if (!file.endsWith(".svg"))
      throw new Error(`${label}.file must end in .svg.`);
    return {
      source,
      file,
      extension,
      href: requireHref(icon.href, `${label}.href`),
      media:
        icon.media === undefined
          ? null
          : requireString(icon.media, `${label}.media`),
    };
  });
  const parsed = {
    icons,
    index: index
      ? {
          production: requireRelativePath(index.production, "index.production"),
          development: requireRelativePath(
            index.development,
            "index.development",
          ),
        }
      : null,
  };
  const outputs = [
    ...(parsed.index ? [parsed.index.development] : []),
    ...icons.map((icon) => icon.file),
  ].map((file) => path.normalize(file));
  const inputs = [
    ...(parsed.index ? [parsed.index.production] : []),
    ...icons.map((icon) => icon.source),
  ].map((file) => path.normalize(file));
  if (new Set(outputs).size !== outputs.length)
    throw new Error("Generated output files must be distinct.");
  if (new Set(icons.map((icon) => icon.href)).size !== icons.length)
    throw new Error("Generated icon URLs must be distinct.");
  if (outputs.some((file) => inputs.includes(file))) {
    throw new Error(
      "Generated output files must not overwrite a production icon or index.",
    );
  }
  return parsed;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function resolveInside(root, relativePath, label) {
  const resolved = path.resolve(root, relativePath);
  if (!isInside(root, resolved)) {
    throw new Error(`${label} must stay inside the site root.`);
  }
  return resolved;
}

async function readBoundedRegularFile(filePath, maximumBytes, label) {
  const stats = await statsOrNull(filePath);
  if (!stats?.isFile() || stats.isSymbolicLink()) {
    throw new Error(
      `${label} must be a regular, non-symlink file: ${filePath}`,
    );
  }
  if (stats.size > maximumBytes) {
    throw new Error(
      `${label} exceeds its ${maximumBytes}-byte limit: ${filePath}`,
    );
  }
  return readFile(filePath);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderDevelopmentFavicon(bytes, extension) {
  if (extension === ".png") {
    if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      throw new Error("Production favicon has an invalid PNG signature.");
    }
  } else if (extension === ".svg") {
    if (!/<svg\b[^>]*>[\s\S]*<\/svg>\s*$/u.test(bytes.toString("utf8"))) {
      throw new Error("Production favicon must be a complete SVG image.");
    }
  } else {
    throw new Error("Production favicon must be PNG or SVG.");
  }
  const type = extension === ".png" ? "image/png" : "image/svg+xml";
  // Embed the original bytes: no recoloring, tracing, cropping, or logo resizing.
  // A four-pixel dot at tab size remains inside the canvas with a half-pixel inset.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <image width="16" height="16" href="data:${type};base64,${bytes.toString("base64")}" />
  <circle cx="13.5" cy="2.5" r="2" fill="${DEVELOPMENT_FAVICON_COLOR}" />
</svg>
`;
}

function relTokens(linkTag) {
  const match = linkTag.match(/\brel\s*=\s*(["'])(.*?)\1/iu);
  return match ? match[2].trim().toLowerCase().split(/\s+/u) : [];
}

function developmentIconLinks(config, indentation, newline) {
  return [
    ...config.icons.map((icon) => {
      const attributes = [
        'rel="icon"',
        'type="image/svg+xml"',
        `href="${icon.href}"`,
        ...(icon.media ? [`media="${escapeAttribute(icon.media)}"`] : []),
      ];
      const line = `${indentation}<link ${attributes.join(" ")} />`;
      // Generated HTML follows the product family's 100-column formatting contract.
      return line.length <= 100
        ? line
        : [
            `${indentation}<link`,
            ...attributes.map((attribute) => `${indentation}  ${attribute}`),
            `${indentation}/>`,
          ].join(newline);
    }),
    "",
  ].join(newline);
}

export function renderDevelopmentIndex(productionIndex, config) {
  if (config.icons.some((icon) => productionIndex.includes(icon.href))) {
    throw new Error(
      "Production index must not reference development favicon assets.",
    );
  }
  const newline = productionIndex.includes("\r\n") ? "\r\n" : "\n";
  const ranges = [];
  for (const match of productionIndex.matchAll(/<link\b[^>]*>/giu)) {
    const tokens = relTokens(match[0]);
    const isStandardIcon =
      tokens.includes("icon") && !tokens.includes("apple-touch-icon");
    const isMaskIcon = tokens.includes("mask-icon");
    if (!isStandardIcon && !isMaskIcon) continue;

    const start = match.index;
    const end = start + match[0].length;
    const lineStart = productionIndex.lastIndexOf("\n", start - 1) + 1;
    const nextNewline = productionIndex.indexOf("\n", end);
    const lineEnd =
      nextNewline === -1 ? productionIndex.length : nextNewline + 1;
    const prefix = productionIndex.slice(lineStart, start);
    const suffix = productionIndex.slice(
      end,
      nextNewline === -1 ? lineEnd : nextNewline,
    );
    if (prefix.trim() !== "" || suffix.trim() !== "") {
      throw new Error(
        "Every production favicon <link> must occupy its own line.",
      );
    }
    ranges.push({ end: lineEnd, indentation: prefix, start: lineStart });
  }
  if (ranges.length === 0) {
    throw new Error(
      "Production index must declare at least one favicon <link>.",
    );
  }

  let output = "";
  let cursor = 0;
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    output += productionIndex.slice(cursor, range.start);
    if (index === 0) {
      output += developmentIconLinks(config, range.indentation, newline);
    }
    cursor = range.end;
  }
  output += productionIndex.slice(cursor);
  return output;
}

async function nearestExistingAncestor(candidate) {
  let current = candidate;
  while (true) {
    if (await statsOrNull(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
}

async function assertSafeOutput(root, filePath, label) {
  const existing = await statsOrNull(filePath);
  if (existing && (!existing.isFile() || existing.isSymbolicLink())) {
    throw new Error(
      `${label} must be a regular, non-symlink file when it exists: ${filePath}`,
    );
  }
  const ancestor = await nearestExistingAncestor(path.dirname(filePath));
  const realAncestor = await realpath(ancestor);
  if (!isInside(root, realAncestor)) {
    throw new Error(
      `${label} resolves outside the site root through a symlink.`,
    );
  }
}

async function readCurrentOutput(filePath) {
  const stats = await statsOrNull(filePath);
  if (!stats) return null;
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(
      `Generated output must be a regular, non-symlink file: ${filePath}`,
    );
  }
  return readFile(filePath, "utf8");
}

async function writeAtomic(filePath, content) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });
  const tempPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(tempPath, content, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o644,
    });
    await rename(tempPath, filePath);
  } finally {
    await rm(tempPath, { force: true });
  }
}

export async function synchronizeDevelopmentFavicon({
  apply = false,
  configPath = CONFIG_NAME,
  root = process.cwd(),
} = {}) {
  const requestedRoot = path.resolve(root);
  const rootStats = await statsOrNull(requestedRoot);
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error(
      `Site root must be an existing, non-symlink directory: ${requestedRoot}`,
    );
  }
  const siteRoot = await realpath(requestedRoot);
  const packagePath = path.join(siteRoot, "package.json");
  await readBoundedRegularFile(
    packagePath,
    MAX_CONFIG_BYTES,
    "Site package manifest",
  );

  const resolvedConfigPath = resolveInside(
    siteRoot,
    requireRelativePath(configPath, "--config"),
    "--config",
  );
  const configBytes = await readBoundedRegularFile(
    resolvedConfigPath,
    MAX_CONFIG_BYTES,
    "Development favicon config",
  );
  const config = parseDevelopmentFaviconConfig(
    parseJson(configBytes, "Development favicon config"),
  );

  const expectedOutputs = [];
  for (const icon of config.icons) {
    const sourcePath = resolveInside(siteRoot, icon.source, "icon.source");
    if (!isInside(siteRoot, await realpath(sourcePath))) {
      throw new Error("Production favicon resolves outside the site root.");
    }
    const bytes = await readBoundedRegularFile(
      sourcePath,
      MAX_ICON_BYTES,
      "Production favicon",
    );
    expectedOutputs.push({
      content: renderDevelopmentFavicon(bytes, icon.extension),
      label: "Development favicon",
      path: resolveInside(siteRoot, icon.file, "icon.file"),
    });
  }
  if (config.index) {
    const productionIndexPath = resolveInside(
      siteRoot,
      config.index.production,
      "index.production",
    );
    const productionIndexBytes = await readBoundedRegularFile(
      productionIndexPath,
      MAX_INDEX_BYTES,
      "Production index",
    );
    expectedOutputs.push({
      content: renderDevelopmentIndex(
        productionIndexBytes.toString("utf8"),
        config,
      ),
      label: "Development index",
      path: resolveInside(
        siteRoot,
        config.index.development,
        "index.development",
      ),
    });
  }

  await Promise.all(
    expectedOutputs.map((output) =>
      assertSafeOutput(siteRoot, output.path, output.label),
    ),
  );
  const currentOutputs = await Promise.all(
    expectedOutputs.map((output) => readCurrentOutput(output.path)),
  );
  const stale = expectedOutputs.filter(
    (output, index) => currentOutputs[index] !== output.content,
  );

  if (!apply && stale.length > 0) {
    throw new Error(
      `Development favicon output is missing or stale:\n${stale
        .map((output) => `- ${path.relative(siteRoot, output.path)}`)
        .join("\n")}\nRun cx-development-favicon --apply from the site root.`,
    );
  }

  if (apply) {
    for (const output of stale) {
      await writeAtomic(output.path, output.content);
    }
  }

  return {
    changed: stale.map((output) => path.relative(siteRoot, output.path)),
    configPath: path.relative(siteRoot, resolvedConfigPath),
    current: expectedOutputs
      .filter((output) => !stale.includes(output))
      .map((output) => path.relative(siteRoot, output.path)),
    root: siteRoot,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) return;
  const result = await synchronizeDevelopmentFavicon(options);
  if (options.apply) {
    console.log(
      result.changed.length > 0
        ? `Generated ${result.changed.length} development favicon files.`
        : "Development favicon files are already current.",
    );
  } else {
    console.log("Development favicon files are current.");
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
