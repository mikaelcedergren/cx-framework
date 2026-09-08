#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dirname, "..");
const sourceExtension =
  /\.(?:css|scss|sass|less|html|[cm]?[jt]sx?|vue|svelte|astro)$/u;
const excludedDirectory =
  /^(?:\.git|node_modules|dist|build|coverage|\.angular|\.run|\.cortex|tests?|__tests__|__fixtures__|fixtures)$/u;
const tokenName = "--[a-zA-Z_][\\w-]*";

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function blank(value) {
  return value.replace(/[^\n]/gu, " ");
}

// Keep offsets stable so findings refer to the original file, including inline styles.
function withoutComments(source) {
  return source.replace(
    /\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|^[ \t]*\/\/[^\n]*/gmu,
    blank,
  );
}

function globalScope(source, index) {
  const stack = [];
  let start = 0;
  let quote = null;
  for (let cursor = 0; cursor < index; cursor++) {
    const char = source[cursor];
    if (quote) {
      if (char === "\\") cursor++;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    // Sass interpolation is a value, not a selector block.
    if (char === "#" && source[cursor + 1] === "{") {
      const end = source.indexOf("}", cursor + 2);
      if (end >= 0 && end < index) {
        cursor = end;
        continue;
      }
    }
    if (char === "{") {
      stack.push(source.slice(start, cursor).trim());
      start = cursor + 1;
    } else if (char === "}") {
      stack.pop();
      start = cursor + 1;
    } else if (char === ";") start = cursor + 1;
  }
  const selectors = stack.filter(
    (value) => !/^@(media|supports|layer|container)\b/u.test(value),
  );
  return (
    selectors.length === 1 &&
    selectors[0]
      .split(",")
      .every((selector) =>
        /^:root(?:\.[\w-]+|\[[^\]]+\])*$/u.test(selector.trim()),
      )
  );
}

function declarations(source) {
  const matches = [];
  const pattern = new RegExp(`(${tokenName})\\s*["']?\\s*\\]?\\s*:`, "gu");
  for (const match of source.matchAll(pattern)) {
    const previous = source[match.index - 1] ?? "";
    // A BEM modifier followed by a pseudo-class is a selector, not a property.
    if (/[\w.&#}\-]/u.test(previous)) continue;
    if (previous === "'" || previous === '"') {
      // Quoted JavaScript dictionary keys only describe styling inside a style object.
      const opening = source.lastIndexOf("{", match.index);
      const prefix = source.slice(Math.max(0, opening - 100), opening);
      const inline = /\bstyle\s*=\s*["']$/iu.test(
        source.slice(Math.max(0, match.index - 100), match.index),
      );
      if (
        !inline &&
        !/\bstyles?\b[^;{}]*$/iu.test(prefix) &&
        !/\.style\s*,\s*$/u.test(prefix)
      )
        continue;
    }
    matches.push(match);
  }
  return matches;
}

export function globalTokens(source) {
  const clean = withoutComments(source);
  return new Set(
    declarations(clean)
      .filter((match) => globalScope(clean, match.index))
      .map((match) => match[1]),
  );
}

export function inspectStyleTokens(
  source,
  { globals = new Set(), globalFile = false } = {},
) {
  const clean = withoutComments(source);
  const findings = [];
  const seen = new Set();
  function add(index, name, kind) {
    const line = clean.slice(0, index).split("\n").length;
    const identity = `${index}:${name}:${kind}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    const statement = clean.slice(index).split(/[;}]/u, 1)[0].trim();
    findings.push({
      line,
      name,
      kind,
      signature: `${kind}:${name}:${statement}`,
    });
  }
  for (const match of declarations(clean)) {
    if (!(globalFile && globalScope(clean, match.index)))
      add(match.index, match[1], "intermediate declaration");
  }
  for (const match of clean.matchAll(
    new RegExp(`var\\(\\s*(${tokenName})`, "gu"),
  )) {
    const interpolated = clean
      .slice(match.index + match[0].length)
      .startsWith("${");
    if (
      !globals.has(match[1]) &&
      !(interpolated && [...globals].some((name) => name.startsWith(match[1])))
    )
      add(match.index, match[1], "non-global reference");
  }
  for (const match of clean.matchAll(
    new RegExp(`(?:style\\.|@property\\s+)(${tokenName})`, "gu"),
  )) {
    if (!(
      globalFile &&
      match[0].startsWith("@property") &&
      globals.has(match[1])
    )) {
      add(match.index, match[1], "intermediate binding");
    }
  }
  for (const match of clean.matchAll(/\.setProperty\s*\(\s*([^,\n]+)/gu)) {
    const argument = match[1].trim();
    const literal = argument.match(/^(["'`])([^"'`$]*)\1$/u);
    if (literal?.[2].startsWith("--")) {
      const rootWrite = /document\.documentElement\.style\s*$/u.test(
        clean.slice(Math.max(0, match.index - 80), match.index),
      );
      if (!(rootWrite && globals.has(literal[2])))
        add(match.index, literal[2], "runtime intermediate");
    } else if (
      !literal &&
      /\.style\s*$/u.test(
        clean.slice(Math.max(0, match.index - 40), match.index),
      )
    ) {
      add(match.index, "dynamic property name", "unresolved style write");
    }
  }
  for (const match of clean.matchAll(
    new RegExp(
      `\\.setStyle\\(\\s*[^,]+,\\s*["'\x60](${tokenName})["'\x60]`,
      "gu",
    ),
  )) {
    add(match.index, match[1], "runtime intermediate");
  }
  for (const match of clean.matchAll(
    new RegExp(
      `\\.style\\s*\\[\\s*["'\x60](${tokenName})["'\x60]\\s*\\]\\s*=`,
      "gu",
    ),
  )) {
    add(match.index, match[1], "runtime intermediate");
  }
  return findings.sort((a, b) => a.line - b.line);
}

function relativeSource(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    path.posix.normalize(value) === value &&
    !value.endsWith("/") &&
    !path.isAbsolute(value) &&
    !value.split(/[\\/]/u).includes("..") &&
    !value.includes("\\") &&
    !/[\x00*?]/u.test(value)
  );
}

async function safeRead(root, file) {
  const absolute = path.resolve(root, file);
  const canonical = await realpath(absolute);
  const relative = path.relative(root, canonical);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    (await lstat(absolute)).isSymbolicLink()
  ) {
    throw new Error(`Token check source must remain inside its owner: ${file}`);
  }
  return readFile(absolute, "utf8");
}

async function readPolicy(root) {
  let source;
  try {
    source = await safeRead(root, "style-token-policy.json");
  } catch (error) {
    if (error.code === "ENOENT")
      return { sourceRoots: ["."], globalTokenFiles: [] };
    throw error;
  }
  const policy = JSON.parse(source);
  if (
    !policy ||
    typeof policy !== "object" ||
    Array.isArray(policy) ||
    Object.keys(policy).some(
      (key) => !["sourceRoots", "globalTokenFiles"].includes(key),
    )
  ) {
    throw new Error(
      "style-token-policy.json accepts only sourceRoots and globalTokenFiles.",
    );
  }
  for (const key of ["sourceRoots", "globalTokenFiles"]) {
    if (
      !Array.isArray(policy[key]) ||
      policy[key].some((value) => !relativeSource(value)) ||
      new Set(policy[key]).size !== policy[key].length
    ) {
      throw new Error(
        `style-token-policy.json ${key} must contain unique exact repository-relative paths.`,
      );
    }
  }
  if (!policy.sourceRoots.length)
    throw new Error("Token check needs at least one source root.");
  return policy;
}

function inRoots(file, roots) {
  return roots.some(
    (root) => root === "." || file === root || file.startsWith(`${root}/`),
  );
}

async function walk(root, directory = "") {
  const files = [];
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const file = path.posix.join(directory, entry.name);
    if (
      entry.isDirectory() &&
      !(directory === "" && entry.name === "data") &&
      !excludedDirectory.test(entry.name)
    )
      files.push(...(await walk(root, file)));
    else if (entry.isFile() && sourceExtension.test(file)) files.push(file);
  }
  return files;
}

export async function checkStyleTokens({
  root = process.cwd(),
  base = "HEAD",
  all = false,
} = {}) {
  root = await realpath(path.resolve(root));
  const policy = await readPolicy(root);
  for (const owner of policy.sourceRoots) {
    const absolute = path.resolve(root, owner);
    const canonical = await realpath(absolute);
    const relative = path.relative(root, canonical);
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      (await lstat(absolute)).isSymbolicLink()
    ) {
      throw new Error(
        `Style source root must remain inside its owner: ${owner}`,
      );
    }
  }
  const globals = new Set();
  for (const entry of await readdir(path.join(packageRoot, "tokens"), {
    withFileTypes: true,
  })) {
    if (entry.isFile() && sourceExtension.test(entry.name)) {
      for (const name of globalTokens(
        await readFile(path.join(packageRoot, "tokens", entry.name), "utf8"),
      ))
        globals.add(name);
    }
  }
  for (const file of policy.globalTokenFiles) {
    if (!sourceExtension.test(file))
      throw new Error(`Global token source is not a stylesheet: ${file}`);
    for (const name of globalTokens(await safeRead(root, file)))
      globals.add(name);
  }

  let gitRoot = false;
  try {
    gitRoot =
      path.resolve(git(root, ["rev-parse", "--show-toplevel"]).trim()) === root;
  } catch {
    /* Non-Git products receive a full audit. */
  }
  let files;
  let revision;
  if (gitRoot) {
    files = git(root, ["ls-files", "-co", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean);
    if (!all) {
      // Reject option-shaped refs and fail rather than silently skipping an unavailable CI base.
      if (base.startsWith("-") || /[\x00\n]/u.test(base))
        throw new Error("Invalid token-check base revision.");
      try {
        revision = git(root, [
          "rev-parse",
          "--verify",
          `${base}^{commit}`,
        ]).trim();
      } catch (error) {
        if (base !== "HEAD" || git(root, ["rev-list", "--all"]).trim())
          throw error;
        // Before the first commit there is no baseline: audit every owned source file.
      }
      if (revision) {
        const changed = new Set([
          ...git(root, [
            "diff",
            "--name-only",
            "--no-renames",
            "-z",
            revision,
            "--",
          ]).split("\0"),
          ...git(root, [
            "ls-files",
            "--others",
            "--exclude-standard",
            "-z",
          ]).split("\0"),
        ]);
        files = files.filter((file) => changed.has(file));
      }
    }
  } else files = await walk(root);

  files = [...new Set(files)]
    .filter(
      (file) =>
        sourceExtension.test(file) &&
        file.split("/")[0] !== "data" &&
        !file.split("/").some((segment) => excludedDirectory.test(segment)) &&
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(file) &&
        (inRoots(file, policy.sourceRoots) ||
          policy.globalTokenFiles.includes(file)),
    )
    .sort();
  const issues = [];
  let existing = 0;
  for (const file of files) {
    let source;
    try {
      source = await safeRead(root, file);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const options = {
      globals,
      globalFile: policy.globalTokenFiles.includes(file),
    };
    const findings = inspectStyleTokens(source, options);
    const previous = new Map();
    if (revision) {
      let before = "";
      try {
        before = git(root, ["show", `${revision}:${file}`]);
      } catch {
        /* A new source file has no previous findings. */
      }
      for (const finding of inspectStyleTokens(before, options)) {
        previous.set(
          finding.signature,
          (previous.get(finding.signature) ?? 0) + 1,
        );
      }
    }
    for (const finding of findings) {
      const count = previous.get(finding.signature) ?? 0;
      if (count > 0) {
        previous.set(finding.signature, count - 1);
        existing++;
      } else issues.push({ file, ...finding });
    }
  }
  return {
    issues,
    existing,
    files: files.length,
    mode: revision ? "change" : "audit",
    base: revision,
  };
}

export function formatStyleTokenIssue(issue) {
  return `${issue.file}:${issue.line}: ${issue.name} — ${issue.kind}; apply tokens.direct-global.`;
}

async function main() {
  const options = {};
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--all") options.all = true;
    else if (arg === "--root" || arg === "--base") {
      if (!args[index + 1]) throw new Error(`${arg} requires a value.`);
      options[arg.slice(2)] = args[++index];
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: cx-style-token-check [--root <repository>] [--base <commit>] [--all]\nChecks new violations against HEAD by default; --base covers a complete change and --all audits existing source.",
      );
      return;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  const result = await checkStyleTokens(options);
  for (const issue of result.issues)
    console.error(formatStyleTokenIssue(issue));
  console.log(
    `Style token ${result.mode}: ${result.files} files, ${result.issues.length} violations${result.mode === "change" ? `, ${result.existing} unchanged findings in checked files (not approved)` : ""}.`,
  );
  if (result.issues.length) process.exitCode = 1;
}

if (import.meta.main)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
