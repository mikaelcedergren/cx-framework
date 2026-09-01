#!/usr/bin/env node
import path from "node:path";
import { randomUUID } from "node:crypto";
import { inflateSync } from "node:zlib";
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
const MAX_MARK_BYTES = 1024 * 1024;
const MAX_PNG_DIMENSION = 512;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_COLOR_CHANNELS = new Map([
  [0, 1],
  [2, 3],
  [4, 2],
  [6, 4],
]);
const PNG_MASK_MODES = new Set(["alpha", "dark", "light", "non-white"]);
const CONFIG_KEYS = new Set(["favicon", "index", "mark", "maskIcon"]);
const MARK_KEYS = new Set(["mode", "source", "threshold"]);
const INDEX_KEYS = new Set(["development", "production"]);
const OUTPUT_KEYS = new Set(["file", "href"]);
const SVG_ROOT_KEYS = new Set(["viewBox", "xmlns"]);
const SVG_PATH_KEYS = new Set([
  "clip-rule",
  "d",
  "fill",
  "fill-rule",
  "opacity",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-width",
]);
const SVG_PATH_ATTRIBUTE_ORDER = [
  "fill",
  "fill-rule",
  "clip-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "d",
];
const MARK_BOX = Object.freeze({ x: 0.5, y: 3, width: 11.75, height: 12.5 });
const CORNER_NOTCH_PATH = "M10.5 0H16V5.5h-1.75V1.75H10.5Z";

function printHelp() {
  console.log(`Generate one consistent development favicon for Safari and Chromium browsers.

Usage:
  cx-development-favicon
  cx-development-favicon --apply
  cx-development-favicon --root /path/to/site
  cx-development-favicon --config path/to/config.json

Options:
  --apply          Write the generated favicon, Safari mask, and development index.
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

function requireOutput(value, label) {
  const output = assertPlainObject(value, label);
  assertExactKeys(output, OUTPUT_KEYS, label);
  return {
    file: requireRelativePath(output.file, `${label}.file`),
    href: requireHref(output.href, `${label}.href`),
  };
}

export function parseDevelopmentFaviconConfig(value) {
  const config = assertPlainObject(value, "Development favicon config");
  assertExactKeys(config, CONFIG_KEYS, "Development favicon config");

  const mark = assertPlainObject(config.mark, "mark");
  assertExactKeys(mark, MARK_KEYS, "mark");
  const source = requireRelativePath(mark.source, "mark.source");
  const extension = path.extname(source).toLowerCase();
  if (extension !== ".png" && extension !== ".svg") {
    throw new Error("mark.source must end in .png or .svg.");
  }

  let mode = null;
  let threshold = null;
  if (extension === ".png") {
    mode = requireString(mark.mode, "mark.mode");
    if (!PNG_MASK_MODES.has(mode)) {
      throw new Error(
        `mark.mode must be one of: ${[...PNG_MASK_MODES].join(", ")}.`,
      );
    }
    threshold = mark.threshold;
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 255) {
      throw new Error("mark.threshold must be an integer from 1 through 255.");
    }
  } else if (mark.mode !== undefined || mark.threshold !== undefined) {
    throw new Error("SVG marks must omit mark.mode and mark.threshold.");
  }

  const index = assertPlainObject(config.index, "index");
  assertExactKeys(index, INDEX_KEYS, "index");
  const parsed = {
    favicon: requireOutput(config.favicon, "favicon"),
    index: {
      development: requireRelativePath(index.development, "index.development"),
      production: requireRelativePath(index.production, "index.production"),
    },
    mark: { extension, mode, source, threshold },
    maskIcon: requireOutput(config.maskIcon, "maskIcon"),
  };

  const outputFiles = [
    parsed.favicon.file,
    parsed.index.development,
    parsed.maskIcon.file,
  ];
  if (new Set(outputFiles).size !== outputFiles.length) {
    throw new Error("Generated output files must be distinct.");
  }
  if (parsed.favicon.href === parsed.maskIcon.href) {
    throw new Error("favicon.href and maskIcon.href must be distinct.");
  }
  if (
    outputFiles.includes(parsed.mark.source) ||
    outputFiles.includes(parsed.index.production)
  ) {
    throw new Error(
      "Generated output files must not overwrite the source mark or production index.",
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

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paethPredictor(left, above, upperLeft) {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

export function decodePng(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < PNG_SIGNATURE.length) {
    throw new Error("PNG source is empty or truncated.");
  }
  if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("PNG source has an invalid signature.");
  }

  let offset = PNG_SIGNATURE.length;
  let header = null;
  let sawEnd = false;
  const compressedParts = [];

  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) {
      throw new Error("PNG source has a truncated chunk header.");
    }
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcOffset = dataEnd;
    if (dataEnd + 4 > bytes.length) {
      throw new Error(`PNG ${type} chunk exceeds the source length.`);
    }
    const expectedCrc = bytes.readUInt32BE(crcOffset);
    const actualCrc = crc32(bytes.subarray(offset + 4, dataEnd));
    if (expectedCrc !== actualCrc) {
      throw new Error(`PNG ${type} chunk has an invalid checksum.`);
    }
    const data = bytes.subarray(dataStart, dataEnd);

    if (type === "IHDR") {
      if (header || length !== 13) {
        throw new Error("PNG source must contain one valid IHDR chunk.");
      }
      header = {
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        height: data.readUInt32BE(4),
        interlace: data[12],
        width: data.readUInt32BE(0),
      };
    } else if (type === "IDAT") {
      compressedParts.push(data);
    } else if (type === "IEND") {
      sawEnd = true;
      offset = dataEnd + 4;
      break;
    }

    offset = dataEnd + 4;
  }

  if (!header || !sawEnd || compressedParts.length === 0) {
    throw new Error("PNG source must contain IHDR, IDAT, and IEND chunks.");
  }
  if (offset !== bytes.length) {
    throw new Error("PNG source contains bytes after IEND.");
  }
  if (
    header.width < 1 ||
    header.height < 1 ||
    header.width > MAX_PNG_DIMENSION ||
    header.height > MAX_PNG_DIMENSION
  ) {
    throw new Error(
      `PNG dimensions must be between 1 and ${MAX_PNG_DIMENSION} pixels.`,
    );
  }
  const channels = PNG_COLOR_CHANNELS.get(header.colorType);
  if (
    header.bitDepth !== 8 ||
    !channels ||
    header.compression !== 0 ||
    header.filter !== 0 ||
    header.interlace !== 0
  ) {
    throw new Error(
      "PNG source must be non-interlaced 8-bit grayscale, RGB, grayscale-alpha, or RGBA.",
    );
  }

  const rowLength = header.width * channels;
  const expectedInflatedLength = (rowLength + 1) * header.height;
  const compressed = Buffer.concat(compressedParts);
  if (compressed.length > MAX_MARK_BYTES) {
    throw new Error("PNG compressed image data exceeds the mark size limit.");
  }
  let inflated;
  try {
    inflated = inflateSync(compressed, {
      maxOutputLength: expectedInflatedLength,
    });
  } catch (error) {
    throw new Error(
      `PNG image data could not be decompressed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (inflated.length !== expectedInflatedLength) {
    throw new Error("PNG decompressed image data has an unexpected length.");
  }

  const scanlines = Buffer.alloc(rowLength * header.height);
  let inputOffset = 0;
  for (let y = 0; y < header.height; y += 1) {
    const filterType = inflated[inputOffset];
    inputOffset += 1;
    if (filterType > 4) {
      throw new Error(`PNG row ${y} uses unsupported filter ${filterType}.`);
    }
    const rowOffset = y * rowLength;
    const previousOffset = rowOffset - rowLength;
    for (let x = 0; x < rowLength; x += 1) {
      const raw = inflated[inputOffset + x];
      const left = x >= channels ? scanlines[rowOffset + x - channels] : 0;
      const above = y > 0 ? scanlines[previousOffset + x] : 0;
      const upperLeft =
        y > 0 && x >= channels ? scanlines[previousOffset + x - channels] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = left;
      if (filterType === 2) predictor = above;
      if (filterType === 3) predictor = Math.floor((left + above) / 2);
      if (filterType === 4) predictor = paethPredictor(left, above, upperLeft);
      scanlines[rowOffset + x] = (raw + predictor) & 0xff;
    }
    inputOffset += rowLength;
  }

  const rgba = Buffer.alloc(header.width * header.height * 4);
  for (let pixel = 0; pixel < header.width * header.height; pixel += 1) {
    const sourceOffset = pixel * channels;
    const targetOffset = pixel * 4;
    if (header.colorType === 0 || header.colorType === 4) {
      const gray = scanlines[sourceOffset];
      rgba[targetOffset] = gray;
      rgba[targetOffset + 1] = gray;
      rgba[targetOffset + 2] = gray;
      rgba[targetOffset + 3] =
        header.colorType === 4 ? scanlines[sourceOffset + 1] : 255;
    } else {
      rgba[targetOffset] = scanlines[sourceOffset];
      rgba[targetOffset + 1] = scanlines[sourceOffset + 1];
      rgba[targetOffset + 2] = scanlines[sourceOffset + 2];
      rgba[targetOffset + 3] =
        header.colorType === 6 ? scanlines[sourceOffset + 3] : 255;
    }
  }

  return { height: header.height, rgba, width: header.width };
}

function pixelCoverage(red, green, blue, alpha, mode) {
  const luminance = Math.round(
    (red * 2126 + green * 7152 + blue * 722) / 10000,
  );
  if (mode === "alpha") return alpha;
  if (mode === "dark") return Math.round((alpha * (255 - luminance)) / 255);
  if (mode === "light") return Math.round((alpha * luminance) / 255);
  return Math.round(
    (alpha * Math.max(255 - red, 255 - green, 255 - blue)) / 255,
  );
}

function maskFromPng(png, mode, threshold) {
  const selected = new Uint8Array(png.width * png.height);
  let minimumX = png.width;
  let minimumY = png.height;
  let maximumX = -1;
  let maximumY = -1;
  let selectedCount = 0;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const pixel = y * png.width + x;
      const offset = pixel * 4;
      const coverage = pixelCoverage(
        png.rgba[offset],
        png.rgba[offset + 1],
        png.rgba[offset + 2],
        png.rgba[offset + 3],
        mode,
      );
      if (coverage < threshold) continue;
      selected[pixel] = 1;
      selectedCount += 1;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }

  if (selectedCount === 0) {
    throw new Error("The configured PNG mask selects no visible pixels.");
  }
  if (selectedCount === png.width * png.height) {
    throw new Error(
      "The configured PNG mask selects the entire image; choose a mark-specific mode.",
    );
  }

  const commands = [];
  for (let y = minimumY; y <= maximumY; y += 1) {
    let x = minimumX;
    while (x <= maximumX) {
      if (!selected[y * png.width + x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x <= maximumX && selected[y * png.width + x]) {
        x += 1;
      }
      const length = x - start;
      commands.push(`M${start} ${y}h${length}v1h-${length}z`);
    }
  }

  return {
    bounds: {
      height: maximumY - minimumY + 1,
      minX: minimumX,
      minY: minimumY,
      width: maximumX - minimumX + 1,
    },
    markup: `<path fill="currentColor" d="${commands.join("")}" />`,
  };
}

function parseAttributes(text, allowed, label) {
  const attributes = {};
  const pattern = /([A-Za-z][A-Za-z0-9:-]*)\s*=\s*(["'])(.*?)\2/gu;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (text.slice(cursor, match.index).trim() !== "") {
      throw new Error(`${label} contains malformed attributes.`);
    }
    const name = match[1];
    if (!allowed.has(name) || attributes[name] !== undefined) {
      throw new Error(
        `${label} contains unsupported or duplicate attribute ${JSON.stringify(name)}.`,
      );
    }
    attributes[name] = match[3];
    cursor = match.index + match[0].length;
  }
  if (text.slice(cursor).trim() !== "") {
    throw new Error(`${label} contains malformed attributes.`);
  }
  return attributes;
}

function requireFiniteNumber(
  value,
  label,
  { minimum = -4096, maximum = 4096 } = {},
) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error(
      `${label} must be a finite number from ${minimum} through ${maximum}.`,
    );
  }
  return number;
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markFromSvg(bytes) {
  const text = bytes.toString("utf8").trim();
  const rootMatch = text.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/u);
  if (!rootMatch) {
    throw new Error(
      "SVG mark must contain one root <svg> element and no XML preamble.",
    );
  }
  const rootAttributes = parseAttributes(
    rootMatch[1],
    SVG_ROOT_KEYS,
    "SVG root",
  );
  if (rootAttributes.xmlns !== "http://www.w3.org/2000/svg") {
    throw new Error(
      'SVG mark must declare xmlns="http://www.w3.org/2000/svg".',
    );
  }
  const viewBoxParts = rootAttributes.viewBox?.trim().split(/[\s,]+/u) ?? [];
  if (viewBoxParts.length !== 4) {
    throw new Error("SVG mark viewBox must contain four numbers.");
  }
  const [minX, minY, width, height] = viewBoxParts.map((part, index) =>
    requireFiniteNumber(part, `SVG viewBox value ${index + 1}`),
  );
  if (width <= 0 || height <= 0) {
    throw new Error("SVG mark viewBox width and height must be positive.");
  }

  const inner = rootMatch[2];
  const paths = [];
  const pathPattern = /<path\b([^>]*)\/>/gu;
  let cursor = 0;
  for (const match of inner.matchAll(pathPattern)) {
    if (inner.slice(cursor, match.index).trim() !== "") {
      throw new Error(
        "SVG mark may contain only self-closing <path> elements.",
      );
    }
    const attributes = parseAttributes(match[1], SVG_PATH_KEYS, "SVG path");
    if (
      !attributes.d ||
      !/^[0-9eE+.,\-\sMmLlHhVvCcSsQqTtAaZz]+$/u.test(attributes.d)
    ) {
      throw new Error("Every SVG mark path needs safe path data in d.");
    }
    const fill = attributes.fill ?? "currentColor";
    const stroke = attributes.stroke ?? "none";
    if (
      !["currentColor", "none"].includes(fill) ||
      !["currentColor", "none"].includes(stroke)
    ) {
      throw new Error("SVG mark paint must be currentColor or none.");
    }
    if (fill === "none" && stroke === "none") {
      throw new Error("SVG mark paths must have visible fill or stroke paint.");
    }
    if (attributes["stroke-width"] !== undefined) {
      requireFiniteNumber(attributes["stroke-width"], "SVG stroke-width", {
        minimum: 0.01,
        maximum: 512,
      });
    }
    if (
      attributes["stroke-linecap"] !== undefined &&
      !["butt", "round", "square"].includes(attributes["stroke-linecap"])
    ) {
      throw new Error("SVG stroke-linecap is unsupported.");
    }
    if (
      attributes["stroke-linejoin"] !== undefined &&
      !["arcs", "bevel", "miter", "miter-clip", "round"].includes(
        attributes["stroke-linejoin"],
      )
    ) {
      throw new Error("SVG stroke-linejoin is unsupported.");
    }
    if (attributes.opacity !== undefined) {
      requireFiniteNumber(attributes.opacity, "SVG opacity", {
        minimum: 0,
        maximum: 1,
      });
    }
    for (const ruleName of ["fill-rule", "clip-rule"]) {
      if (
        attributes[ruleName] !== undefined &&
        !["evenodd", "nonzero"].includes(attributes[ruleName])
      ) {
        throw new Error(`SVG ${ruleName} is unsupported.`);
      }
    }
    const normalized = { ...attributes, fill, stroke };
    const serialized = SVG_PATH_ATTRIBUTE_ORDER.filter(
      (name) =>
        normalized[name] !== undefined &&
        !(name === "stroke" && normalized[name] === "none"),
    )
      .map((name) => `${name}="${escapeAttribute(normalized[name])}"`)
      .join(" ");
    paths.push(`<path ${serialized} />`);
    cursor = match.index + match[0].length;
  }
  if (inner.slice(cursor).trim() !== "" || paths.length === 0) {
    throw new Error(
      "SVG mark may contain only one or more self-closing <path> elements.",
    );
  }

  return {
    bounds: { height, minX, minY, width },
    markup: paths.join("\n"),
  };
}

function formatNumber(value) {
  const rounded = Math.round(value * 1000000) / 1000000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function markTransform(bounds) {
  const scale = Math.min(
    MARK_BOX.width / bounds.width,
    MARK_BOX.height / bounds.height,
  );
  const renderedWidth = bounds.width * scale;
  const renderedHeight = bounds.height * scale;
  const translateX =
    MARK_BOX.x + (MARK_BOX.width - renderedWidth) / 2 - bounds.minX * scale;
  const translateY =
    MARK_BOX.y + (MARK_BOX.height - renderedHeight) / 2 - bounds.minY * scale;
  return `matrix(${formatNumber(scale)} 0 0 ${formatNumber(scale)} ${formatNumber(translateX)} ${formatNumber(translateY)})`;
}

function indentMarkup(markup, spaces) {
  const indentation = " ".repeat(spaces);
  return markup
    .split("\n")
    .map((line) => `${indentation}${line}`)
    .join("\n");
}

function renderFavicon(mark, color) {
  const paintedMarkup = mark.markup.replaceAll("currentColor", color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <g transform="${markTransform(mark.bounds)}">
${indentMarkup(paintedMarkup, 4)}
  </g>
  <path fill="${color}" d="${CORNER_NOTCH_PATH}" />
</svg>
`;
}

function relTokens(linkTag) {
  const match = linkTag.match(/\brel\s*=\s*(["'])(.*?)\1/iu);
  return match ? match[2].trim().toLowerCase().split(/\s+/u) : [];
}

function developmentIconLinks(config, indentation, newline) {
  return [
    `${indentation}<link rel="icon" type="image/svg+xml" href="${config.favicon.href}" />`,
    `${indentation}<link rel="mask-icon" href="${config.maskIcon.href}" color="${DEVELOPMENT_FAVICON_COLOR}" />`,
    "",
  ].join(newline);
}

export function renderDevelopmentIndex(productionIndex, config) {
  if (
    productionIndex.includes(config.favicon.href) ||
    productionIndex.includes(config.maskIcon.href)
  ) {
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

  const markPath = resolveInside(siteRoot, config.mark.source, "mark.source");
  const productionIndexPath = resolveInside(
    siteRoot,
    config.index.production,
    "index.production",
  );
  const markBytes = await readBoundedRegularFile(
    markPath,
    MAX_MARK_BYTES,
    "Favicon mark",
  );
  const productionIndexBytes = await readBoundedRegularFile(
    productionIndexPath,
    MAX_INDEX_BYTES,
    "Production index",
  );
  const productionIndex = productionIndexBytes.toString("utf8");
  const mark =
    config.mark.extension === ".png"
      ? maskFromPng(
          decodePng(markBytes),
          config.mark.mode,
          config.mark.threshold,
        )
      : markFromSvg(markBytes);

  const expectedOutputs = [
    {
      content: renderFavicon(mark, DEVELOPMENT_FAVICON_COLOR),
      label: "Development favicon",
      path: resolveInside(siteRoot, config.favicon.file, "favicon.file"),
    },
    {
      content: renderFavicon(mark, "#000000"),
      label: "Development Safari mask icon",
      path: resolveInside(siteRoot, config.maskIcon.file, "maskIcon.file"),
    },
    {
      content: renderDevelopmentIndex(productionIndex, config),
      label: "Development index",
      path: resolveInside(
        siteRoot,
        config.index.development,
        "index.development",
      ),
    },
  ];

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
