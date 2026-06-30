import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const iconRoot = join(repoRoot, "icons");
const sourceDir = join(iconRoot, "svg");
const outputPath = join(iconRoot, "index.html");
const args = process.argv.slice(2);
const validArgs = new Set(["--check", "--help", "-h"]);
const unknownArgs = args.filter((arg) => !validArgs.has(arg));
const isCheckMode = args.includes("--check");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/generate-icon-index.mjs [--check]

Generates icons/index.html from icons/svg.

Options:
  --check  Exit with a non-zero status when any icon check fails.
  --help   Show this help text.
`);
  process.exit(0);
}

if (unknownArgs.length > 0) {
  console.error(`Unknown option${unknownArgs.length === 1 ? "" : "s"}: ${unknownArgs.join(", ")}`);
  console.error("Run with --help for usage.");
  process.exit(1);
}

const SVG_ELEMENT_PATTERN = /<([a-zA-Z][\w:-]*)\b/g;
const ELEMENT_PATTERN = /<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g;
const ATTRIBUTE_PATTERN = /([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"/g;
const GRAPHIC_TAGS = new Set(["path", "circle", "ellipse", "line", "polyline", "polygon", "rect"]);
const NON_PATH_SHAPE_TAGS = new Set(["circle", "ellipse", "line", "polyline", "polygon", "rect"]);
const STRUCTURAL_TAGS = new Set([
  "clippath",
  "defs",
  "g",
  "lineargradient",
  "mask",
  "pattern",
  "radialgradient",
  "symbol",
  "use",
]);
const GEOMETRY_ATTRIBUTES = [
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
  "width",
  "height",
  "points",
  "transform",
];
const INHERITED_ATTRIBUTES = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"];
const TARGET_STROKE_WIDTH = 1.5;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function parseStyle(value) {
  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf(":");

        if (separatorIndex === -1) {
          return [part.toLowerCase(), ""];
        }

        return [part.slice(0, separatorIndex).trim().toLowerCase(), part.slice(separatorIndex + 1).trim()];
      }),
  );
}

function parseAttributes(value) {
  const attrs = {};

  for (const match of value.matchAll(ATTRIBUTE_PATTERN)) {
    attrs[match[1].toLowerCase()] = match[2].trim();
  }

  if (attrs.style) {
    Object.assign(attrs, parseStyle(attrs.style));
  }

  return attrs;
}

function parseElements(svg) {
  const elements = [];
  const stack = [];

  for (const match of svg.matchAll(ELEMENT_PATTERN)) {
    const raw = match[0];
    const tag = match[1];
    const tagName = tag.toLowerCase();
    const isClosingTag = raw.startsWith("</");

    if (isClosingTag) {
      while (stack.length > 0) {
        const element = stack.pop();

        if (element.tagName === tagName) {
          break;
        }
      }

      continue;
    }

    const attrs = parseAttributes(match[2]);
    const parent = stack.at(-1);
    const inheritedAttrs = {};

    for (const name of INHERITED_ATTRIBUTES) {
      inheritedAttrs[name] = attrs[name] ?? parent?.inheritedAttrs[name];
    }

    const element = {
      tag,
      tagName,
      attrs,
      inheritedAttrs,
      isStructuralChild: stack.some(
        (item) => item.tagName === "defs" || item.tagName === "mask" || item.tagName === "clippath",
      ),
    };

    elements.push(element);

    if (!raw.trim().endsWith("/>")) {
      stack.push(element);
    }
  }

  return elements;
}

function collectElementCounts(svg) {
  const counts = {};

  for (const match of svg.matchAll(SVG_ELEMENT_PATTERN)) {
    const tag = match[1].toLowerCase();
    counts[tag] = (counts[tag] ?? 0) + 1;
  }

  return counts;
}

function getAttr(element, name) {
  return element?.attrs[name.toLowerCase()];
}

function getEffectiveAttr(element, name) {
  return element?.inheritedAttrs[name.toLowerCase()];
}

function normalizePaintValue(value) {
  return value?.trim().toLowerCase();
}

function isNonNonePaint(value) {
  const normalized = normalizePaintValue(value);
  return Boolean(normalized && normalized !== "none" && normalized !== "transparent");
}

function hasEffectiveFill(element) {
  return isNonNonePaint(getEffectiveAttr(element, "fill") ?? "black");
}

function isCurrentColor(value) {
  return normalizePaintValue(value) === "currentcolor";
}

function formatFoundValue(value) {
  return value ?? "missing";
}

function formatList(items) {
  return [...new Set(items)].sort().join(", ");
}

function summarizeFillDetails(details) {
  const visibleTargets = details.slice(0, 8).map((detail) => detail.target);
  const overflowCount = details.length - visibleTargets.length;
  const targetSummary = `${visibleTargets.join(", ")}${overflowCount > 0 ? ` + ${overflowCount} more` : ""}`;
  const fillSummary = formatList(details.map((detail) => detail.fill));

  return `${targetSummary}; fill ${fillSummary}`;
}

function normalizeNumber(value, precision = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  const rounded = Number(number.toFixed(precision));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function normalizeGeometryValue(value) {
  return value
    .replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (number) => normalizeNumber(number))
    .replace(/\s+/g, " ")
    .trim();
}

function createShapeFingerprint(elements) {
  const parts = elements
    .filter((element) => GRAPHIC_TAGS.has(element.tagName))
    .map((element) => {
      const attrs = GEOMETRY_ATTRIBUTES.filter((name) => getAttr(element, name) !== undefined)
        .map((name) => `${name}=${normalizeGeometryValue(getAttr(element, name))}`)
        .join("|");

      return `${element.tagName}:${attrs}`;
    })
    .sort();

  return parts.join(";");
}

function isTargetStrokeWidth(value) {
  if (!value) {
    return false;
  }

  return Number.parseFloat(value) === TARGET_STROKE_WIDTH;
}

function parseTransformNumbers(value) {
  return value
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part))
    .filter(Number.isFinite);
}

function hasNonUniformScale(value) {
  if (!value) {
    return false;
  }

  for (const match of value.matchAll(/scale\(([^)]*)\)/gi)) {
    const numbers = parseTransformNumbers(match[1]);

    if (numbers.length > 1 && Math.abs(numbers[0] - numbers[1]) > 0.0001) {
      return true;
    }
  }

  for (const match of value.matchAll(/matrix\(([^)]*)\)/gi)) {
    const [a, b, c, d] = parseTransformNumbers(match[1]);

    if (
      [a, b, c, d].every(Number.isFinite) &&
      Math.abs(b) < 0.0001 &&
      Math.abs(c) < 0.0001 &&
      Math.abs(Math.abs(a) - Math.abs(d)) > 0.0001
    ) {
      return true;
    }
  }

  return false;
}

function parseLengthNumber(value) {
  if (!value) {
    return null;
  }

  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number !== 0 ? number : null;
}

function parseViewBoxRatio(value) {
  if (!value) {
    return null;
  }

  const numbers = parseTransformNumbers(value);

  if (numbers.length !== 4 || numbers[2] === 0 || numbers[3] === 0) {
    return null;
  }

  return Math.abs(numbers[2] / numbers[3]);
}

function ratiosMatch(first, second) {
  if (first === null || second === null) {
    return true;
  }

  return Math.abs(first - second) <= 0.0001;
}

function analyzeIcon(fileName, svg) {
  const name = fileName.replace(/\.svg$/, "");
  const elements = parseElements(svg);
  const root = elements.find((element) => element.tagName === "svg");
  const graphicElements = elements.filter((element) => GRAPHIC_TAGS.has(element.tagName));
  const visibleGraphicElements = graphicElements.filter((element) => !element.isStructuralChild);
  const pathElements = elements.filter((element) => element.tagName === "path");
  const structuralElements = elements.filter((element) => STRUCTURAL_TAGS.has(element.tagName));
  const elementCounts = collectElementCounts(svg);
  const fillMatches = visibleGraphicElements.filter(hasEffectiveFill);
  const graphicIndexByElement = new Map(graphicElements.map((element, index) => [element, index + 1]));
  const pathIndexByElement = new Map(pathElements.map((element, index) => [element, index + 1]));
  const fillDetails = fillMatches.map((element) => ({
    tag: element.tagName,
    target:
      element.tagName === "path"
        ? `path ${pathIndexByElement.get(element)}`
        : `${element.tagName} ${graphicIndexByElement.get(element)}`,
    fill: getEffectiveAttr(element, "fill") ?? "implicit black",
  }));
  const strokeElements = graphicElements.filter((element) => isNonNonePaint(getEffectiveAttr(element, "stroke")));
  const strokeWidthValues = strokeElements.map((element) => getEffectiveAttr(element, "stroke-width") ?? "missing");
  const strokeColorValues = strokeElements.map((element) => getEffectiveAttr(element, "stroke") ?? "missing");
  const strokeLinecapValues = strokeElements.map((element) => getEffectiveAttr(element, "stroke-linecap") ?? "missing");
  const strokeLinejoinValues = strokeElements.map(
    (element) => getEffectiveAttr(element, "stroke-linejoin") ?? "missing",
  );
  const nonPathShapeCount = [...NON_PATH_SHAPE_TAGS].reduce((total, tag) => total + (elementCounts[tag] ?? 0), 0);
  const graphicElementCount = [...GRAPHIC_TAGS].reduce((total, tag) => total + (elementCounts[tag] ?? 0), 0);
  const hasMask = /<mask\b/i.test(svg);
  const hasDefs = /<defs\b/i.test(svg);
  const hasDasharray = /stroke-dasharray=/i.test(svg);
  const hasFill = fillMatches.length > 0;
  const rootIdValue = getAttr(root, "id");
  const hasRootIdIssue = rootIdValue !== "icon";
  const rootFillValue = getAttr(root, "fill");
  const hasRootFillIssue = normalizePaintValue(rootFillValue) !== "none";
  const isPortalPathData = (elementCounts.path ?? 0) === 1 && graphicElementCount === 1;
  const hasStroke = strokeElements.length > 0;
  const hasStrokeWidthIssue = !hasStroke || strokeWidthValues.some((value) => !isTargetStrokeWidth(value));
  const hasStrokeColorIssue = strokeColorValues.some((value) => !isCurrentColor(value));
  const hasLinecapIssue = hasStroke && strokeLinecapValues.some((value) => value !== "round");
  const hasLinejoinIssue = hasStroke && strokeLinejoinValues.some((value) => value !== "round");
  const hasViewBoxIssue = getAttr(root, "viewbox") !== "0 0 24 24";
  const hasSizeIssue = getAttr(root, "width") !== "24" || getAttr(root, "height") !== "24";
  const preserveAspectRatioValue = getAttr(root, "preserveaspectratio");
  const hasPreserveAspectRatioIssue = preserveAspectRatioValue?.trim().toLowerCase() === "none";
  const widthValue = parseLengthNumber(getAttr(root, "width"));
  const heightValue = parseLengthNumber(getAttr(root, "height"));
  const rootRatio = widthValue !== null && heightValue !== null ? Math.abs(widthValue / heightValue) : null;
  const viewBoxRatio = parseViewBoxRatio(getAttr(root, "viewbox"));
  const hasMissingRatioSource = rootRatio === null && viewBoxRatio === null;
  const hasNonSquareViewBoxRatio = viewBoxRatio !== null && !ratiosMatch(viewBoxRatio, 1);
  const hasRootViewBoxRatioMismatch = !ratiosMatch(rootRatio, viewBoxRatio);
  const hasStyleAttribute = elements.some((element) => getAttr(element, "style") !== undefined);
  const hasTransform = elements.some((element) => getAttr(element, "transform") !== undefined);
  const hasNonUniformScaleIssue = elements.some((element) => hasNonUniformScale(getAttr(element, "transform")));
  const hasAspectIssue =
    hasMissingRatioSource ||
    hasNonSquareViewBoxRatio ||
    hasRootViewBoxRatioMismatch ||
    hasPreserveAspectRatioIssue ||
    hasNonUniformScaleIssue;
  const shapeFingerprint = createShapeFingerprint(elements);
  const shapeHash = createHash("sha256").update(shapeFingerprint).digest("hex");
  const hash = createHash("sha256").update(svg).digest("hex");
  const checks = [];
  const tags = [];

  if (!isPortalPathData) {
    checks.push(
      `Portal path data requires all source geometry in one <path d=""> (found ${elementCounts.path ?? 0} paths, ${graphicElementCount} graphic elements).`,
    );
    tags.push("portal-path-data");
  }

  if (hasFill) {
    checks.push(`Uses fill on ${fillMatches.length} graphic element(s): ${summarizeFillDetails(fillDetails)}.`);
    tags.push("fill");
  }

  if (hasRootFillIssue) {
    checks.push(`Root SVG should set fill="none" (found ${formatFoundValue(rootFillValue)}).`);
    tags.push("root-fill");
  }

  if (hasRootIdIssue) {
    checks.push(
      `Root SVG should set id="icon" for external <use> references (found ${formatFoundValue(rootIdValue)}).`,
    );
    tags.push("root-id");
  }

  if (hasStrokeColorIssue) {
    checks.push(`Stroke color must use currentColor (${formatList(strokeColorValues)}).`);
    tags.push("stroke-color");
  }

  if (hasStrokeWidthIssue) {
    checks.push(
      hasStroke
        ? `Stroke width is not consistently ${TARGET_STROKE_WIDTH} (${formatList(strokeWidthValues)}).`
        : `No stroked graphic element with ${TARGET_STROKE_WIDTH} stroke width.`,
    );
    tags.push("stroke-width");
  }

  if (hasMask || hasDefs) {
    checks.push("Contains mask or defs.");
    tags.push("mask-defs");
  }

  if (hasDasharray) {
    checks.push("Uses stroke-dasharray.");
    tags.push("dasharray");
  }

  if (nonPathShapeCount > 0) {
    checks.push("Contains non-path SVG shapes.");
    tags.push("non-path");
  }

  if (hasLinecapIssue) {
    checks.push(`Stroke linecap is not consistently round (${formatList(strokeLinecapValues)}).`);
    tags.push("stroke-style");
  }

  if (hasLinejoinIssue) {
    checks.push(`Stroke linejoin is not consistently round (${formatList(strokeLinejoinValues)}).`);
    tags.push("stroke-style");
  }

  if (hasViewBoxIssue || hasSizeIssue) {
    checks.push(
      `Canvas is not consistently 24x24 (width ${getAttr(root, "width") ?? "missing"}, height ${getAttr(root, "height") ?? "missing"}, viewBox ${getAttr(root, "viewbox") ?? "missing"}).`,
    );
    tags.push("canvas");
  }

  if (hasAspectIssue) {
    checks.push(
      `May scale with the wrong aspect ratio from height (width ${getAttr(root, "width") ?? "missing"}, height ${getAttr(root, "height") ?? "missing"}, viewBox ${getAttr(root, "viewbox") ?? "missing"}, preserveAspectRatio ${preserveAspectRatioValue ?? "default"}, non-uniform scale ${hasNonUniformScaleIssue ? "yes" : "no"}).`,
    );
    tags.push("aspect");
  }

  if (structuralElements.length > 0) {
    checks.push(`Contains structural SVG element(s): ${formatList(structuralElements.map((element) => element.tag))}.`);
    tags.push("structure");
  }

  if (hasStyleAttribute) {
    checks.push("Contains inline style attributes.");
    tags.push("style-attr");
  }

  if (hasTransform) {
    checks.push("Contains transform attributes.");
    tags.push("transform");
  }

  return {
    name,
    slug: slugify(name),
    file: `svg/${fileName}`,
    bytes: Buffer.byteLength(svg, "utf8"),
    bytesLabel: formatBytes(Buffer.byteLength(svg, "utf8")),
    pathCount: elementCounts.path ?? 0,
    graphicElementCount,
    nonPathShapeCount,
    fillCount: fillMatches.length,
    fillDetails,
    strokeCount: strokeElements.length,
    strokeWidthValues: [...new Set(strokeWidthValues)].sort(),
    strokeColorValues: [...new Set(strokeColorValues)].sort(),
    hasFill,
    hasRootIdIssue,
    hasRootFillIssue,
    hasStrokeColorIssue,
    hasPaintIssue: hasFill || hasRootFillIssue || hasStrokeColorIssue,
    hasMask,
    hasDefs,
    hasDasharray,
    isPortalPathData,
    hasStrokeWidthIssue,
    hasStrokeStyleIssue: hasLinecapIssue || hasLinejoinIssue,
    hasCanvasIssue: hasViewBoxIssue || hasSizeIssue,
    hasAspectIssue,
    hasStructureIssue: structuralElements.length > 0,
    hasStyleAttribute,
    hasTransform,
    hash,
    shapeHash,
    tags,
    checks,
    svg,
  };
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const files = readdirSync(sourceDir)
  .filter((file) => file.endsWith(".svg"))
  .sort();
const icons = files.map((file) => {
  const svg = readFileSync(join(sourceDir, file), "utf8");
  return analyzeIcon(file, svg);
});
const byHash = new Map();
const byShapeHash = new Map();

for (const icon of icons) {
  const group = byHash.get(icon.hash) ?? [];
  group.push(icon.name);
  byHash.set(icon.hash, group);

  const shapeGroup = byShapeHash.get(icon.shapeHash) ?? [];
  shapeGroup.push(icon.name);
  byShapeHash.set(icon.shapeHash, shapeGroup);
}

const exactDuplicateGroups = [...byHash.values()].filter((group) => group.length > 1).map((group) => group.sort());
const visualDuplicateGroups = [...byShapeHash.values()]
  .filter((group) => group.length > 1)
  .map((group) => group.sort());

for (const icon of icons) {
  const duplicateGroup = exactDuplicateGroups.find((group) => group.includes(icon.name));
  const visualDuplicateGroup = visualDuplicateGroups.find((group) => group.includes(icon.name));

  if (duplicateGroup) {
    icon.tags.push("exact-duplicate");
    icon.checks.push(`Exact duplicate source: ${duplicateGroup.join(", ")}.`);
  }

  if (visualDuplicateGroup) {
    icon.tags.push("visual-duplicate");
    icon.checks.push(`Possible visual duplicate: ${visualDuplicateGroup.join(", ")}.`);
  }

  icon.tags = [...new Set(icon.tags)];
}

icons.sort((a, b) => a.name.localeCompare(b.name));

const data = {
  sourceRoot: relative(iconRoot, sourceDir),
  generatedFrom: "icons/svg",
  stats: {
    total: icons.length,
    checks: icons.filter((icon) => icon.checks.length > 0).length,
    paint: icons.filter((icon) => icon.hasPaintIssue).length,
    strokeColor: icons.filter((icon) => icon.hasStrokeColorIssue).length,
    rootId: icons.filter((icon) => icon.hasRootIdIssue).length,
    rootFill: icons.filter((icon) => icon.hasRootFillIssue).length,
    portalPathData: icons.filter((icon) => !icon.isPortalPathData).length,
    aspect: icons.filter((icon) => icon.hasAspectIssue).length,
    fill: icons.filter((icon) => icon.hasFill).length,
    strokeWidth: icons.filter((icon) => icon.hasStrokeWidthIssue).length,
    strokeStyle: icons.filter((icon) => icon.hasStrokeStyleIssue).length,
    maskDefs: icons.filter((icon) => icon.hasMask || icon.hasDefs).length,
    dasharray: icons.filter((icon) => icon.hasDasharray).length,
    nonPath: icons.filter((icon) => icon.nonPathShapeCount > 0).length,
    canvas: icons.filter((icon) => icon.hasCanvasIssue).length,
    structure: icons.filter((icon) => icon.hasStructureIssue).length,
    exactDuplicateGroups: exactDuplicateGroups.length,
    visualDuplicateGroups: visualDuplicateGroups.length,
  },
  exactDuplicateGroups,
  visualDuplicateGroups,
  icons,
};

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Icon source index</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f8fa;
        --panel: #ffffff;
        --panel-soft: #f1f5f7;
        --border: #d9e1e5;
        --border-strong: #a9b8c0;
        --text: #172126;
        --muted: #62727b;
        --teal: #007a78;
        --teal-soft: #e2f7f5;
        --amber: #986600;
        --amber-soft: #fff4d8;
        --red: #b42318;
        --red-soft: #ffe7e4;
        --blue: #005f73;
        --ink: #11181c;
        --shadow: 0 1px 2px rgba(12, 24, 32, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      html {
        background: var(--bg);
        color: var(--text);
        font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        margin: 0;
      }

      a {
        color: inherit;
      }

      .page {
        --page-max-width: 1680px;
        --page-padding: 24px;
        margin: 0 auto;
        max-width: var(--page-max-width);
        padding: var(--page-padding);
      }

      .page-header {
        margin-bottom: 18px;
      }

      .eyebrow {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0 0 4px;
      }

      h1 {
        font-size: 28px;
        letter-spacing: 0;
        line-height: 1.15;
        margin: 0;
      }

      .result-count {
        color: var(--muted);
        font-weight: 750;
      }

      .toolbar {
        align-items: center;
        background: rgba(247, 248, 250, 0.94);
        border-bottom: 1px solid var(--border);
        display: grid;
        gap: 12px;
        grid-template-columns: minmax(160px, 220px) minmax(0, 1fr) auto;
        margin: 0 calc(50% - 50vw) 16px;
        padding: 10px max(var(--page-padding), calc((100vw - var(--page-max-width)) / 2 + var(--page-padding)));
        position: sticky;
        top: 0;
        z-index: 20;
      }

      .search {
        appearance: none;
        background: var(--panel);
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        color: var(--text);
        font: inherit;
        height: 36px;
        padding: 0 12px;
        width: 100%;
      }

      .search:focus {
        border-color: var(--teal);
        box-shadow: 0 0 0 3px rgba(0, 122, 120, 0.16);
        outline: none;
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .filter-button {
        align-items: center;
        appearance: none;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text);
        cursor: pointer;
        display: inline-flex;
        gap: 6px;
        font: inherit;
        font-size: 12px;
        font-weight: 650;
        min-height: 30px;
        padding: 5px 10px;
      }

      .filter-button[aria-pressed="true"] {
        background: var(--ink);
        border-color: var(--ink);
        color: white;
      }

      .filter-button__count {
        color: var(--muted);
        font-weight: 750;
      }

      .filter-button[aria-pressed="true"] .filter-button__count {
        color: rgba(255, 255, 255, 0.78);
      }

      .grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
        display: grid;
        gap: 10px;
        padding: 12px;
      }

      .card__header {
        align-items: flex-start;
        display: grid;
        gap: 8px;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .card__name {
        font-size: 15px;
        font-weight: 750;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .card__meta {
        color: var(--muted);
        display: flex;
        flex-wrap: wrap;
        font-size: 12px;
        gap: 4px 8px;
        justify-content: flex-end;
        margin-top: 0;
        max-width: 320px;
      }

      .card__header-tools {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .issue-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 8px;
      }

      .issue-tag {
        align-items: center;
        background: var(--red-soft);
        border: 1px solid rgba(180, 35, 24, 0.22);
        border-radius: 999px;
        color: var(--red);
        display: inline-flex;
        font-size: 11px;
        font-weight: 750;
        min-height: 22px;
        padding: 2px 7px;
      }

      .source-link {
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--muted);
        display: inline-flex;
        font-size: 12px;
        font-weight: 650;
        height: 28px;
        justify-content: center;
        min-width: 58px;
        padding: 0 8px;
        text-decoration: none;
      }

      .source-link:hover {
        border-color: var(--border-strong);
        color: var(--text);
      }

      .checks {
        color: var(--muted);
        font-size: 12px;
        margin: 0;
      }

      .checks summary {
        cursor: pointer;
        font-weight: 650;
      }

      .checks ul {
        display: grid;
        gap: 3px;
        margin: 6px 0 0;
        padding: 0;
      }

      .checks li {
        list-style: none;
      }

      .variants {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
      }

      .variant {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .variant__art {
        align-items: center;
        aspect-ratio: 1 / 1;
        background: #ffffff;
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--ink);
        display: flex;
        justify-content: center;
        min-height: 72px;
        overflow: hidden;
        position: relative;
      }

      .variant__art--aspect::before {
        border: 1px dashed var(--border-strong);
        content: "";
        height: 32px;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
      }

      .variant__art--color {
        gap: 4px;
      }

      .variant__art--fill {
        color: var(--red);
      }

      .variant__art--fill .test-svg {
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }

      .variant__art.is-empty::after {
        color: var(--muted);
        content: "No paths";
        font-size: 11px;
        font-weight: 700;
      }

      .variant__label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-align: center;
      }

      .test-svg {
        color: currentColor;
        display: block;
        height: 24px;
        overflow: visible;
        width: 24px;
      }

      .variant__art--tiny .test-svg {
        height: 16px;
        width: 16px;
      }

      .variant__art--aspect .test-svg {
        height: 32px;
        max-width: 56px;
        position: relative;
        width: auto;
        z-index: 1;
      }

      .variant__art--color .test-svg {
        height: 18px;
        width: 18px;
      }

      .test-svg--fill-base {
        color: var(--muted);
        opacity: 0.22;
      }

      .test-svg--fill-overlay {
        color: var(--red);
        opacity: 0.88;
      }

      .empty {
        align-items: center;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--muted);
        display: flex;
        justify-content: center;
        min-height: 180px;
      }

      @media (max-width: 980px) {
        .toolbar {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .page {
          --page-padding: 14px;
        }

        .card__header {
          grid-template-columns: 1fr;
        }

        .card__header-tools,
        .card__meta {
          justify-content: flex-start;
        }

        .card__meta {
          max-width: none;
        }

        .variants {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">icons/svg</p>
          <h1>Icon source index</h1>
        </div>
      </header>

      <section class="toolbar" aria-label="Icon filters">
        <input class="search" id="search" type="search" placeholder="Search icons" autocomplete="off">
        <div class="filters" id="filters"></div>
        <div class="result-count" id="result-count" aria-live="polite"></div>
      </section>

      <main class="grid" id="grid"></main>
    </div>

    <script>
      const iconData = ${safeJson(data)};
      const variants = [
        { id: "original", label: "Original" },
        { id: "tiny", label: "16 px" },
        { id: "aspect", label: "32 px fit" },
        { id: "color", label: "Color" },
        { id: "dashless", label: "Dash removed" },
        { id: "fill", label: "Source fill" },
      ];
      const filters = [
        { id: "all", label: "All", description: "Show every icon in icons/svg." },
        { id: "checks", label: "Checks", description: "Show icons with any source-quality failure." },
        { id: "paint", label: "Paint", description: "Show icons that use source fill, hardcoded paint instead of currentColor, or a root fill other than none." },
        { id: "portalPathData", label: "Portal path data", description: "Show icons that cannot be represented as one Portal-compatible path-data payload." },
        { id: "strokeWidth", label: "Stroke width", description: "Show icons that do not use stroke-width 1.5 on every stroked graphic element." },
        { id: "strokeStyle", label: "Stroke style", description: "Show icons missing round stroke-linecap or stroke-linejoin on stroked elements." },
        { id: "canvas", label: "Canvas", description: "Show icons whose root width, height, or viewBox is not 24 by 24." },
        { id: "aspect", label: "Aspect", description: "Show icons that may scale incorrectly when height-fitted because of ratio or preserveAspectRatio issues." },
        { id: "structure", label: "Structure", description: "Show icons missing the ASM root id or relying on structural SVG markup such as groups, masks, defs, transforms, or inline styles." },
        { id: "dasharray", label: "Dasharray", description: "Show icons that use stroke-dasharray instead of explicit path geometry." },
        { id: "visualDuplicate", label: "Visual duplicates", description: "Show icons with identical normalized path geometry under different names." },
      ];
      const state = {
        filter: "all",
        query: "",
      };

      const filtersEl = document.querySelector("#filters");
      const gridEl = document.querySelector("#grid");
      const resultCountEl = document.querySelector("#result-count");
      const searchEl = document.querySelector("#search");

      function escapeRegExp(value) {
        return value.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
      }

      function rewriteIds(svg, suffix) {
        const idMap = new Map();
        svg.querySelectorAll("[id]").forEach((element) => {
          const oldId = element.id;
          const newId = oldId + "--" + suffix;
          idMap.set(oldId, newId);
          element.id = newId;
        });

        if (idMap.size === 0) {
          return;
        }

        [svg, ...svg.querySelectorAll("*")].forEach((element) => {
          [...element.attributes].forEach((attribute) => {
            let value = attribute.value;

            for (const [oldId, newId] of idMap) {
              const escaped = escapeRegExp(oldId);
              value = value.replace(new RegExp("url\\\\(#" + escaped + "\\\\)", "g"), "url(#" + newId + ")");
              value = value.replace(new RegExp("#" + escaped + "\\\\b", "g"), "#" + newId);
            }

            if (value !== attribute.value) {
              element.setAttribute(attribute.name, value);
            }
          });
        });
      }

      function isVisiblePaint(value) {
        const normalized = value && value.trim().toLowerCase();
        return Boolean(normalized && normalized !== "none" && normalized !== "transparent");
      }

      function getPresentationAttribute(element, name) {
        return element.style.getPropertyValue(name) || element.getAttribute(name);
      }

      function applyPreviewStrokeBehavior(svg) {
        svg.querySelectorAll(${safeJson([...GRAPHIC_TAGS].join(","))}).forEach((element) => {
          if (!element.closest("defs, mask, clipPath")) {
            element.setAttribute("vector-effect", "non-scaling-stroke");
          }
        });
      }

      function applyFillOnly(svg) {
        const visit = (element, inheritedFill) => {
          const rawFill = getPresentationAttribute(element, "fill");
          const effectiveFill = rawFill || inheritedFill || "black";
          const tagName = element.tagName.toLowerCase();
          const isStructuralChild = Boolean(element.closest("defs, mask, clipPath"));

          if (${safeJson([...GRAPHIC_TAGS])}.includes(tagName) && !isStructuralChild) {
            element.setAttribute("fill", isVisiblePaint(effectiveFill) ? "currentColor" : "none");
            element.setAttribute("stroke", "none");
          }

          for (const child of element.children) {
            visit(child, effectiveFill);
          }
        };

        visit(svg, null);
      }

      function prepareSvg(svgText, icon, variantId, index) {
        const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
        const parserError = doc.querySelector("parsererror");

        if (parserError) {
          return null;
        }

        const svg = document.importNode(doc.documentElement, true);
        svg.querySelectorAll("script, foreignObject").forEach((element) => element.remove());
        rewriteIds(svg, icon.slug + "-" + variantId + "-" + index);
        svg.classList.add("test-svg");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        if (variantId !== "aspect") {
          svg.removeAttribute("width");
          svg.removeAttribute("height");
        }

        if (!svg.getAttribute("viewBox") && variantId !== "aspect") {
          svg.setAttribute("viewBox", "0 0 24 24");
        }

        applyPreviewStrokeBehavior(svg);

        if (variantId === "dashless") {
          svg.querySelectorAll("[stroke-dasharray]").forEach((element) => {
            element.setAttribute("stroke-dasharray", "none");
          });
        }

        return svg;
      }

      function createFillDiagnosticSvgs(icon, index) {
        const overlay = prepareSvg(icon.svg, icon, "fill-overlay", index);

        if (!overlay) {
          return [];
        }

        applyFillOnly(overlay);
        overlay.classList.add("test-svg--fill-overlay");

        if (!icon.hasFill) {
          return [overlay];
        }

        const base = prepareSvg(icon.svg, icon, "fill-base", index);

        if (!base) {
          return [overlay];
        }

        base.classList.add("test-svg--fill-base");
        return [base, overlay];
      }

      function createColorSvgs(icon, index) {
        return [
          ["ink", "#11181c"],
          ["red", "#b42318"],
          ["blue", "#005f73"],
        ]
          .map(([name, color]) => {
            const svg = prepareSvg(icon.svg, icon, "color-" + name, index);

            if (svg) {
              svg.style.color = color;
            }

            return svg;
          })
          .filter(Boolean);
      }

      function createPreview(icon, variant, index) {
        const wrapper = document.createElement("div");
        const art = document.createElement("div");
        const label = document.createElement("div");
        const svgs = variant.id === "color"
          ? createColorSvgs(icon, index)
          : variant.id === "fill"
            ? createFillDiagnosticSvgs(icon, index)
            : [prepareSvg(icon.svg, icon, variant.id, index)].filter(Boolean);

        wrapper.className = "variant";
        art.className = "variant__art variant__art--" + variant.id;
        label.className = "variant__label";
        label.textContent = variant.label;

        if (svgs.length > 0) {
          art.append(...svgs);
        } else {
          art.classList.add("is-empty");
        }

        wrapper.append(art, label);
        return wrapper;
      }

      function checkLabel(tag) {
        return {
          "portal-path-data": "portal path data",
          "fill": "source fill",
          "root-id": "root id",
          "root-fill": "root fill",
          "stroke-color": "stroke color",
          "stroke-width": "stroke width",
          "aspect": "aspect",
          "mask-defs": "mask/defs",
          "dasharray": "dasharray",
          "non-path": "non-path",
          "stroke-style": "stroke style",
          "canvas": "canvas",
          "structure": "structure",
          "style-attr": "style attr",
          "transform": "transform",
          "exact-duplicate": "exact duplicate",
          "visual-duplicate": "visual duplicate",
        }[tag] || tag;
      }

      function createCard(icon, index) {
        const card = document.createElement("article");
        const header = document.createElement("div");
        const titleWrap = document.createElement("div");
        const title = document.createElement("h2");
        const meta = document.createElement("div");
        const headerTools = document.createElement("div");
        const issueTags = document.createElement("div");
        const link = document.createElement("a");
        const checks = document.createElement("details");
        const checkList = document.createElement("ul");
        const previewGrid = document.createElement("div");

        card.className = "card";
        header.className = "card__header";
        headerTools.className = "card__header-tools";
        title.className = "card__name";
        title.textContent = icon.name;
        meta.className = "card__meta";
        meta.innerHTML = "<span>" + icon.bytesLabel + "</span><span>" + icon.pathCount + " paths</span><span>" + icon.graphicElementCount + " graphics</span><span>" + (icon.isPortalPathData ? "path data ok" : "path data issue") + "</span>" + (icon.fillCount > 0 ? "<span>" + icon.fillCount + " source fills</span>" : "");
        issueTags.className = "issue-tags";
        link.className = "source-link";
        link.href = icon.file;
        link.textContent = "Source";
        checks.className = "checks";
        previewGrid.className = "variants";

        const summary = document.createElement("summary");
        summary.textContent = icon.checks.length + " check" + (icon.checks.length === 1 ? "" : "s");
        checks.appendChild(summary);

        for (const tag of icon.tags) {
          const chip = document.createElement("span");
          chip.className = "issue-tag";
          chip.textContent = checkLabel(tag);
          issueTags.appendChild(chip);
        }

        for (const check of icon.checks) {
          const item = document.createElement("li");
          item.textContent = check;
          checkList.appendChild(item);
        }

        checks.appendChild(checkList);

        for (const variant of variants) {
          previewGrid.appendChild(createPreview(icon, variant, index));
        }

        titleWrap.append(title);
        headerTools.append(meta, link);

        if (icon.tags.length > 0) {
          titleWrap.appendChild(issueTags);
        }

        header.append(titleWrap, headerTools);
        card.append(header);

        if (icon.checks.length > 0) {
          card.appendChild(checks);
        }

        card.appendChild(previewGrid);
        return card;
      }

      function matchesFilterId(icon, filterId) {
        if (filterId === "all") {
          return true;
        }

        if (filterId === "checks") {
          return icon.checks.length > 0;
        }

        if (filterId === "paint") {
          return icon.hasPaintIssue;
        }

        if (filterId === "portalPathData") {
          return !icon.isPortalPathData;
        }

        if (filterId === "aspect") {
          return icon.hasAspectIssue;
        }

        if (filterId === "strokeWidth") {
          return icon.hasStrokeWidthIssue;
        }

        if (filterId === "dasharray") {
          return icon.hasDasharray;
        }

        if (filterId === "visualDuplicate") {
          return icon.tags.includes("visual-duplicate");
        }

        if (filterId === "structure") {
          return icon.hasStructureIssue || icon.hasStyleAttribute || icon.hasTransform || icon.hasRootIdIssue;
        }

        if (filterId === "canvas") {
          return icon.hasCanvasIssue;
        }

        if (filterId === "strokeStyle") {
          return icon.hasStrokeStyleIssue;
        }

        return true;
      }

      function matchesFilter(icon) {
        return matchesFilterId(icon, state.filter);
      }

      function matchesQuery(icon) {
        if (!state.query) {
          return true;
        }

        const haystack = [icon.name, icon.file, ...icon.tags, ...icon.checks].join(" ").toLowerCase();
        return haystack.includes(state.query);
      }

      function renderFilters() {
        filtersEl.innerHTML = "";
        for (const filter of filters) {
          const count = iconData.icons.filter((icon) => matchesFilterId(icon, filter.id)).length;
          const button = document.createElement("button");
          const labelEl = document.createElement("span");
          const countEl = document.createElement("span");

          button.className = "filter-button";
          button.type = "button";
          button.title = filter.description;
          button.setAttribute("aria-label", filter.label + ": " + filter.description);
          button.setAttribute("aria-pressed", String(state.filter === filter.id));

          labelEl.textContent = filter.label;
          countEl.className = "filter-button__count";
          countEl.textContent = count;
          button.append(labelEl, countEl);

          button.addEventListener("click", () => {
            state.filter = filter.id;
            render();
            renderFilters();
          });
          filtersEl.appendChild(button);
        }
      }

      function render() {
        const visibleIcons = iconData.icons.filter((icon) => matchesFilter(icon) && matchesQuery(icon));
        const fragment = document.createDocumentFragment();

        gridEl.innerHTML = "";
        resultCountEl.textContent = visibleIcons.length + " / " + iconData.icons.length;

        for (const [index, icon] of visibleIcons.entries()) {
          fragment.appendChild(createCard(icon, index));
        }

        if (visibleIcons.length > 0) {
          gridEl.appendChild(fragment);
        } else {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No icons match";
          gridEl.appendChild(empty);
        }
      }

      searchEl.addEventListener("input", (event) => {
        state.query = event.target.value.trim().toLowerCase();
        render();
      });

      renderFilters();
      render();
    </script>
  </body>
</html>
`;

writeFileSync(outputPath, html);
console.log(`Wrote ${relative(repoRoot, outputPath)} with ${icons.length} icons.`);

if (isCheckMode) {
  const iconsWithChecks = icons.filter((icon) => icon.checks.length > 0);

  if (iconsWithChecks.length > 0) {
    console.error(`Icon checks failed: ${iconsWithChecks.length} of ${icons.length} icons have issues.`);

    for (const icon of iconsWithChecks) {
      console.error(`- ${icon.name}: ${icon.checks.join(" ")}`);
    }

    process.exitCode = 1;
  } else {
    console.log(`Icon checks passed: ${icons.length} icons, 0 issues.`);
  }
}
